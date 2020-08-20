import { Server } from "https://code4sabae.github.io/js/Server.js"

class MyServer extends Server {
    api(path, req) {
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
        } else if (path === "/api/getalarm") {
            const json = JSON.parse(Deno.readTextFileSync('./alarm.json'));
            return json;
        } else if (path === "/api/getquest") {
            const json = JSON.parse(Deno.readTextFileSync('./quest.json'));
            json.map(dat => { delete dat.answer; });
            return json;
        }
    }
}

new MyServer(8881);