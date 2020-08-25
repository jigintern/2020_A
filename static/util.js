import { fetchJSON } from "https://code4sabae.github.io/js/fetchJSON.js";

export function askNotification() {
    // 通知を許可するかユーザに問いかける
    navigator.serviceWorker.register("sw.js").then(() => {
        Notification.requestPermission(function (permission) {
            if (permission === 'denied') {
                //ta.value = 'プッシュ通知を有効にできません。ブラウザの設定を確認して下さい。';
            }
        });
    });
}

export async function getUuid() {
    // keyを指定して取得
    // 「 key1=val1; key2=val2; key3=val3; ・・・ 」というCookie情報が保存されているとする
    var arr = new Array();
    if (document.cookie != '') {
        var tmp = document.cookie.split('; ');
        for (var i = 0; i < tmp.length; i++) {
            var data = tmp[i].split('=');
            arr[data[0]] = decodeURIComponent(data[1]);
        }
    }
    let uuid = arr['uuid'];

    if (uuid === undefined) {
        uuid = await generateUuid();
        document.cookie = "uuid=" + uuid + "; expires= Mon, 31 Aug 2030 00:00:00 GMT;SameSite=Lax";   // cookie作成
    }

    return uuid;
}

async function generateUuid() {
    const res = await (await fetch("/api/getid")).json();
    console.log(res);
    return res.id;
    /*
    let chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("");
    for (let i = 0, len = chars.length; i < len; i++) {
        switch (chars[i]) {
            case "x":
                chars[i] = Math.floor(Math.random() * 16).toString(16);
                break;
            case "y":
                chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
                break;
        }
    }
    return chars.join("");*/
}

export async function showNotification(uuid) {
    // 通知を許可するかユーザに問いかける
    //navigator.serviceWorker.register("sw.js").then(() => {
    Notification.requestPermission(async function (permission) {
        if (permission === 'denied') {
            //ta.value = 'プッシュ通知を有効にできません。ブラウザの設定を確認して下さい。';
        } else {
            let state = null;
            // state -> 過ぎてたら 1 、ピッタリで 0、まだだったら -1

            if (uuid === undefined) uuid = await getUuid();
            var json = await fetchJSON("/api/getalarm", { id: uuid });
            console.log(json);
            if (json === null) {
                console.log("起きる時刻を設定してください");
            } else {
                console.log("----");
                console.log(json.id);
                console.log(json.time);

                state = compareTime(json.time);
                console.log("compareTime", state);
                if (state >= 0) {
                    // document.getElementById("text").innerHTML= "gone...";
                    /*var newData = json;
                    let delIndex = -1;
                    var f = newData.filter(function (item, index) {
                        if (item.id === myId) {
                            delIndex = index;
                            return true;
                        }
                    });
                    delete newData[delIndex];*/
                    // 過ぎていた場合データを消す。更新方法はまだ未定
                    // ↑過ぎていた場合はサーバ側で消せばいいと思う by すずとも

                } else {

                    var cnt = setInterval(function () {
                        state = compareTime(json.time);
                        if (state >= 0) {
                            console.log("now");
                            const notification = new Notification("起きる時間だよ！\n今日もミッション頑張ろう！");
                            notification.onclick = () => {
                                window.focus();
                                window.open("/showQuest.html", "_top");
                                //const w = window.open("/showQuest.html", "_blank");
                                //w.focus();
                                //w.document.focus();
                                //window.location.replace("./showQuest.html");
                            }
                            // document.getElementById("text").innerHTML= "good morning";
                            clearInterval(cnt);
                            // cmp(compareTimeの返り値)が0以上なら時間が過ぎているのでループを抜ける
                        }

                    }, 200);
                    // 200msごとにまわしている
                }
            }
        }
    });
    //});
}

function compareTime(setTime) {
    var now = new Date();
    var nowTime = now.getTime();
    if (setTime < nowTime) {
        return 1;
    } else if (setTime > nowTime) {
        return -1;
    } else {
        return 0;
    }
}