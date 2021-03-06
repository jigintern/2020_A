import { Server } from "https://code4sabae.github.io/js/Server.js"
import { v4 } from "https://deno.land/std/uuid/mod.ts";
import  ky from 'https://unpkg.com/ky/index.js';



class MyServer extends Server {
    api(path, req) {

        // アラームを追加する ( req = {"id": ~~~, "time": ~~~, "difficultyChoice": ~~~} )
        if (path === "/api/setalarm") {
            var ajson = JSON.parse(Deno.readTextFileSync('./alarm.json'));
            var fjson = JSON.parse(Deno.readTextFileSync('./profile.json'));
            let userPrevTime;
            // 重複を確認 なければ追加 あれば更新
            const aDup = ajson.find(dat => dat.id === req.id);
            if (aDup === undefined) {
                userPrevTime = null;
                ajson.push(req);
            } else {
                userPrevTime = aDup.time;
                aDup.time = req.time;
                aDup.difficultyChoice = req.difficultyChoice;
                aDup.repeat = req.repeat;
            }
            Deno.writeTextFileSync("./alarm.json", JSON.stringify(ajson));
            const fDup = fjson.find(dat => dat.id === req.id);
            if (fDup === undefined) {
                fjson.push({
                    "id": req.id,
                    "name": null,
                    "icon": null,
                    "introduction": null,
                    "prevTime": userPrevTime,
                    "solution": null,
                    "solved": []
                });
            } else {
                fDup.prevTime = userPrevTime;
            }
            Deno.writeTextFileSync("./profile.json", JSON.stringify(fjson));
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
            const jsondoc = JSON.parse(JSON.stringify(json));
            jsondoc.map(dat => { delete dat.questId });
            delete jsondoc.questId;
            // 重複を確認 なければ追加 あればエラーを返す
            const dup = jsondoc.find(dat => JSON.stringify(dat) === JSON.stringify(req));
            if (dup === undefined && req.answerList.length !== 1) {
                const occupied = json.map(dat => dat.questId);
                let newQuestId = 0;
                for (; (occupied.find(dat => dat === newQuestId) !== undefined); newQuestId++);
                req.questId = newQuestId;

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
        //   既に解いた  -> finish
        //   設定時刻の前 -> early
        //   全問題時間切れ -> timeover
        //   問題なし -> OK
        else if (path === "/api/getquest") {
            const ajson = JSON.parse(Deno.readTextFileSync('./alarm.json'));
            const qjson = JSON.parse(Deno.readTextFileSync('./quest.json'));
            const pjson = JSON.parse(Deno.readTextFileSync('./profile.json'));
            // 解答データを削除
            qjson.map(dat => { delete dat.answer });
            const p_dup = pjson.find(dat => dat.id === req.id);
            const dup = ajson.find(dat => dat.id === req.id);
            
            if (dup === undefined) {
                return { res: "notset", quests: [], difficultyChoice: null };
            }
            if (p_dup !== undefined) {
                const nowtime = new Date();
                const now = new Date(nowtime.getTime() - nowtime.getTimezoneOffset()*60000);
                const sol = new Date(p_dup.solution - nowtime.getTimezoneOffset()*60000);
                if (now.getUTCDate() === sol.getUTCDate() && now.getMonth() === sol.getMonth()) { //TODO
                    return { res: "finish", quests: [], difficultyChoice: null };
                }
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
        
        // カテゴリ一覧を返す 
        else if (path === "/api/getcategory") {
            const json = JSON.parse(Deno.readTextFileSync('./quest.json'));
            let cat = [];
            let i = 0;
            for (i in json) {
                cat.push(json[i].category);
            }
            const ficat = Array.from(new Set(cat));
            return {category: ficat};
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
            fDup.solution = new Date().getTime();
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
                let ranking = 1;
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

                return ret;
            }　else {
                return align;
            }

        }
        
        // プロフィールを設定 ( req = {"id": ~~~, "name": ~~~, "icon": ~~~, "introduction": ~~~} )
        else if (path === "/api/setprofile") {
            const json = JSON.parse(Deno.readTextFileSync('./profile.json'));
            const dup = json.find(dat => dat.id === req.id);
            if (dup === undefined) {
                req.prevTime = null;
                req.solution = null;
                req.solved = [];
                json.push(req);
            } else {
                dup.name = req.name;
                dup.icon = req.icon;
                dup.introduction = req.introduction;
            }
            Deno.writeTextFileSync("./profile.json", JSON.stringify(json));
            return { res: "OK" };
        }

        // 名前・アイコン・ポイント・順位を取得 ( req = {"id": ~~~} )
        else if (path === "/api/getprofile") {
            const pjson = JSON.parse(Deno.readTextFileSync('./point.json'));
            const fjson = JSON.parse(Deno.readTextFileSync('./profile.json'));
            const pDup = pjson.find(dat => dat.id === req.id);
            // ポイントを取得
            if (pDup === undefined) {
                var userPoint = 0;
            } else {
                var userPoint = pDup.point;
            }
            // 順位を取得
            pjson.sort(function(p1, p2) {
                if (p1.point < p2.point) {
                    return 1;
                } else {
                    return -1;
                }
            });
            let userRank = null;
            for (let i = 0; i < pjson.length; i++) {
                if (pjson[i].id === req.id) {
                    userRank = i + 1;
                    break;
                }
            }
            // 名前とアイコンを取得
            const fDup = fjson.find(dat => dat.id === req.id);
            if (fDup === undefined) {
                return {
                    id: req.id,
                    name: null,
                    icon: null,
                    introduction: null,
                    prevTime: null,
                    solution: null,
                    solved: [],
                    point: userPoint,
                    rank: userRank
                };
            } else {
                fDup.point = userPoint;
                fDup.rank = userRank;
                return fDup;
            }
        }
        
        else if (path === "/api/slack") {
            const parsed =  ky.post(req.url, {json: {text: req.text}});
            return { res: "OK" };
        }
    }
}

new MyServer(8881);
