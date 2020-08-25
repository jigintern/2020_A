import { Server } from "https://code4sabae.github.io/js/Server.js"
import { v4 } from "https://deno.land/std/uuid/mod.ts";

class MyServer extends Server {
    api(path, req) {

        // アラームを追加する ( req = {"id": ~~~, "alarm": ~~~, "difficultyChoice": ~~~} )
        if (path === "/api/setalarm") {
            var json = JSON.parse(Deno.readTextFileSync('./alarm.json'));
            // 重複を確認 なければ追加 あれば更新
            const dup = json.find(dat => dat.id === req.id);
            if (dup === undefined) {
                
                json.push(req);
            } else {
                dup.last = dup.time;
                dup.time = req.time;
                dup.difficultyChoice = req.difficultyChoice;
            }
            Deno.writeTextFileSync("./alarm.json", JSON.stringify(json));
            return { res: "OK" };
        }

        // アラーム一覧を取得する ( req = {"id": ~~~} )
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
                dup.time = req.time + 86400000;
                dup.difficultyChoice = req.difficultyChoice;
                dup.repeat = req.repeat;
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
        else if (path === "/api/getquest") {
            const ajson = JSON.parse(Deno.readTextFileSync('./alarm.json'));
            const qjson = JSON.parse(Deno.readTextFileSync('./quest.json'));
            // 解答データを削除
            qjson.map(dat => { delete dat.answer });
            const dup = ajson.find(dat => dat.id === req.id);
            if (dup === undefined) {
                return { res: "Failed" };
            } else {
                const rtjson = { quests: qjson, difficultyChoice: dup.difficultyChoice }
                return rtjson;
            }
        }

        // 答え合わせをしてポイントを変更する ( req = {"id": ~~~, "questId": ~~~, "answer": ~~~} )
        else if (path === "/api/checkans") {
            const ajson = JSON.parse(Deno.readTextFileSync('./alarm.json'));
            const pjson = JSON.parse(Deno.readTextFileSync('./point.json'));
            const qjson = JSON.parse(Deno.readTextFileSync('./quest.json'));
            // 問題の特定
            const org = qjson.find(dat => dat.questId === req.questId);
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
            Deno.writeTextFileSync("./point.json", JSON.stringify(pjson));
            return { result: rlt, answer: org.answer };
        }

        // idの取得
        else if (path === "/api/getid") {
            const uuid = v4.generate();
            return { id: uuid };
        }

        // ポイント上位5人の成績取得
        else if (path = "/api/getpointrank") {
            const json = JSON.parse(Deno.readTextFileSync('./point.json'));
            let align = json;
            if (json.length > 4){
                align.sort(function(val1,val2){
                var val1 = val1.point;
                var val2 = val2.point;
                if( val1 < val2 ) {
                    return 1;
                    } else {
                        return -1;
                    }
                });
                let tmp = align[0].point;
                let ranking = 0;
                let ret =[];
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
                return json;
            }

        }
    }
}

new MyServer(8881);
