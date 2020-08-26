import { Server } from "https://code4sabae.github.io/js/Server.js"
import { v4 } from "https://deno.land/std/uuid/mod.ts";
import  ky from 'https://unpkg.com/ky/index.js';



class MyServer extends Server {
    api(path, req) {

        // アラームを追加する ( req = {"id": ~~~, "time": ~~~, "difficultyChoice": ~~~} )
        if (path === "/api/setalarm") {
            var json = JSON.parse(Deno.readTextFileSync('./alarm.json'));
            // 重複を確認 なければ追加 あれば更新
            const dup = json.find(dat => dat.id === req.id);
            if (dup === undefined) {
                let pushData = req;
                pushData.prevTime = null;
                json.push(req);
            } else {
                dup.prevTime = dup.time;
                dup.time = req.time;
                dup.difficultyChoice = req.difficultyChoice;
            }
            Deno.writeTextFileSync("./alarm.json", JSON.stringify(json));
            return { res: "OK" };
        }

        // アラームを取得する ( req = {"id": ~~~} )
        else if (path === "/api/getalarm") {
            const json = JSON.parse(Deno.readTextFileSync('./alarm.json'));
            const dup = json.find(dat => dat.id === req.id);
            if (dup === undefined) {
                return null;
            } else {
                return dup;
            }
        }

        // 一日延ばして更新
        else if (path === "/api/updatealarm") {
            var json = JSON.parse(Deno.readTextFileSync('./alarm.json'));
            // 重複を確認 なければ追加 あれば更新
            const dup = json.find(dat => dat.id === req.id);
            // if (dup === undefined) {
            //     json.push(req);
            // } else {
                dup.time += 86400000;
//                 dup.difficultyChoice = req.difficultyChoice;
//                 dup.repeat = req.repeat;
            // }
            Deno.writeTextFileSync("./alarm.json", JSON.stringify(json));
            return { res: "OK" };
        }

        // 任意のIDのアラームを一覧から消す
        else if (path === "/api/delalarm") {
                const json = JSON.parse(Deno.readTextFileSync('./alarm.json'));
                const dup = json.filter(
                    function(item,index) {
                    if(item.id !== req) {
                        return true;
                    }
                }
                );
                Deno.writeTextFileSync("./alarm.json", JSON.stringify(dup));
                return {res: "OK"};
        }


        // 問題を追加する ( req = {問題データ} )
        else if (path === "/api/setquest") {
            const json = JSON.parse(Deno.readTextFileSync('./quest.json'));
            const jsondoc = json;
            const reqdoc = req;
            jsondoc.map(dat => { delete dat.questId });
            delete reqdoc.questId;
            // 重複を確認 なければ追加 あればエラーを返す
            const dup = jsondoc.find(dat => JSON.stringify(dat) === JSON.stringify(reqdoc));
            if (dup === undefined) {
                json.push(req);
                Deno.writeTextFileSync("./quest.json", JSON.stringify(json));
                return { res: "OK" };
            } else {
                return { res: "Failed" };
            }
        }

        // 問題一覧を取得する ( req = {"id": ~~~} )
        // 一回解いたことがある問題は返さない
        // 戻り値
        //   アラームを設定していない -> notset
        //   設定時刻の前 -> early
        //   全問題時間切れ -> timeover
        //   問題なし -> OK
        else if (path === "/api/getquest") {
            const ajson = JSON.parse(Deno.readTextFileSync('./alarm.json'));
            const qjson = JSON.parse(Deno.readTextFileSync('./quest.json'));
            const pjson = JSON.parse(Deno.readTextFileSync('./profile.json'));
            // 解答データを削除
            qjson.map(dat => { delete dat.answer });
            const dup = ajson.find(dat => dat.id === req.id);
            if (dup === undefined) {
                return { res: "notset", quests: [], difficultyChoice: null };
            }
            const elapsedTime = new Date().getTime() - dup.time;
            if (elapsedTime < 0) {
                return { res: "early", quests: [], difficultyChoice: null };
            }
            const longest = qjson.map(dat => dat.timeLimit).reduce((max, dat) => (max < dat) ? dat : max);
            if (elapsedTime > (longest * 60000)) {
                return { res: "timeover", quests: [], difficultyChoice: null };
            }

            const pdup = (pjson.find(dat => dat.id === req.id));
            const notsol = qjson.filter(function (item,index) {
                let i = 0;
                let check = true;
                for (i in pdup.solved) {
                    if (pdup.solved[i] === item.questId) {
                        check = false;
                    }
                }
                return check;
            }
            );

            return { res: "OK", quests: notsol, difficultyChoice: dup.difficultyChoice };

        }
        
        // カテゴリごと一覧を返す (res = {"category": ~~~})
        else if (path === "/api/getcategory") {
            const json = JSON.parse(Deno.readTextFileSync('./quest.json'));
            const dup = json.filter(
                function(item,index) {
                if(item.category === req.category) {
                    return true;
                }
            }
            );
            if (dup.length === 0) {
                return { res: "NotFound"};
            }
            else {
                return dup;
            }
        }

        // 答え合わせをしてポイントを変更する ( req = {"id": ~~~, "questId": ~~~, "answer": ~~~} )
        else if (path === "/api/checkans") {
            const ajson = JSON.parse(Deno.readTextFileSync('./alarm.json'));
            const pjson = JSON.parse(Deno.readTextFileSync('./point.json'));
            const qjson = JSON.parse(Deno.readTextFileSync('./quest.json'));
             const fjson = JSON.parse(Deno.readTextFileSync('./profile.json'));
            // 問題の特定
            const org = qjson.find(dat => dat.questId === req.questId);
            const fDup = fjson.find(dat => dat.id === req.id);
            var deltapt;
            if (org.answer === req.answer) {
                var rlt = "correct";
                deltapt = org.point;
            } else {
                var rlt = "incorrect";
                deltapt = -org.point;
            }
            // 回答時間の計算
            const usralarm = ajson.find(dat => dat.id === req.id);
            if ((new Date().getTime() - usralarm.time) > (org.timeLimit * 60000)) {
                var rlt = "timeover";
                deltapt = -org.point;
            }
            // ポイントの変更
            const dup = pjson.find(dat => dat.id === req.id);
            if (dup === undefined) {
                pjson.push( { "id": req.id, "point": deltapt } );
            } else {
                dup.point += deltapt;
            }
            fDup.solution = true;
            fDup.solved.push(org.questId);
            Deno.writeTextFileSync("./profile.json", JSON.stringify(fjson));
            Deno.writeTextFileSync("./point.json", JSON.stringify(pjson));
            return { result: rlt, answer: org.answer };
        }

        // idの取得
        else if (path === "/api/getid") {
            const uuid = v4.generate();
            return { id: uuid };
        }

        // ポイント上位5人の成績取得
        else if (path === "/api/getpointrank") {
            const json = JSON.parse(Deno.readTextFileSync('./point.json'));
            let align = json;
            align.sort(function(val1,val2){
                var val1 = val1.point;
                var val2 = val2.point;
                if( val1 < val2 ) {
                    return 1;
                    } else {
                        return -1;
                    }
                });
            if (json.length > 4){
                let tmp = align[0].point;
                let ranking = 0;
                let ret = [];
                let i = 1;
                ret.push(align[0]);
                for (; ranking < 5; i++) {
                    console.log(align[i]);
                    ret.push(align[i]);
                    console.log(tmp, align[i].point);
                    if (tmp !== align[i].point) {
                        ranking += 1;
                        tmp = align[i].point;
                    }
                }

                return JSON.stringify(ret);
            }　else {
                return align;
            }

        }
        else if (path === "/api/slack") {
            const parsed =  ky.post(req.url, {json: {text: req.text}});
            return { res: "OK" };
        }
    }
}

new MyServer(8881);
