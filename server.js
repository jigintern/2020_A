import { Server } from "https://code4sabae.github.io/js/Server.js"

class MyServer extends Server {
    api(path, req) {

        // アラームを追加する ( req = {アラームのデータ} )
        if (path === "/api/setalarm") {
            var json = JSON.parse(Deno.readTextFileSync('./alarm.json'));
            // 重複を確認 なければ追加 あれば更新
            const dup = json.find(dat => dat.id === req.id);
            if (dup === undefined) {
                json.push(req);
            } else {
                dup.time = req.time;
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
        
        // 問題一覧を取得する
        else if (path === "/api/getquest") {
            const json = JSON.parse(Deno.readTextFileSync('./quest.json'));
            // 答えを除く時は以下を実行
            // json.map(dat => { delete dat.answer });
            return json;
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
    }
    // idの取得
    else if (path === "/api/getid") {
            const uuid = v4.generate();
            return {id:uuid};

    }
    // ポイント上位5人の成績取得
    else if (path = "/api/getpointrank") {
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
            let ret =[];
            let i = 0;
            for (; i < 5; i++) {
                ret.push(align[i]);
            }   // top5
            console.log(align[i].point);
            for(;align[4].point === align[i].point;i++) {
                ret.push(align[i]);
            }// 5位と同率でも送る
            return JSON.stringify(ret);
        }
}

new MyServer(8881);
