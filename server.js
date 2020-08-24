import { Server } from "https://code4sabae.github.io/js/Server.js"

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
                dup.time = req.time;
                dup.difficultyChoice = req.difficultyChoice;
            }
            Deno.writeTextFileSync("./alarm.json", JSON.stringify(json));
            return { res: "OK" };
        }
        
        // アラーム一覧を取得する
        else if (path === "/api/getalarm") {
            const json = JSON.parse(Deno.readTextFileSync('./alarm.json'));
            return json;
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
                const rtjson = [qjson, { "difficultyChoice": dup.difficultyChoice }];
                return rtjson;
            }
        }

        // 答え合わせをする ( req = {"id": ~~~, "questId": ~~~, "answer": ~~~} )
        else if (path === "/api/checkans") {
            const ajson = JSON.parse(Deno.readTextFileSync('./alarm.json'));
            const qjson = JSON.parse(Deno.readTextFileSync('./quest.json'));
            // 問題の特定
            const org = qjson.find(dat => dat.questId === req.questId);
            if (org.answer === req.answer) {
                var rlt = "correct";
            } else {
                var rlt = "incorrect";
            }
            // 回答時間の計算
            const usralarm = ajson.find(dat => dat.id === req.id);
            if ((new Date().getTime() - usralarm.time) > (org.timeLimit*60000)) {
                var rlt = "timeover";
            }
            return { result: rlt, answer: org.answer };
        }

        // ポイントを加減算する ( req = {"id": ~~~, "point": ~~~} )
        else if (path === "/api/adjustpt") {
            const json = JSON.parse(Deno.readTextFileSync('./point.json'));
            const dup = json.find(dat => dat.id === req.id);
            if (dup === undefined) {
                json.push(req);
            } else {
                dup.point += req.point;
            }
            Deno.writeTextFileSync("./point.json", JSON.stringify(json));
            return { res: "OK" };
        }
    }
}

new MyServer(8881);