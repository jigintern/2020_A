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
        document.cookie = "uuid=" + uuid + "; expires= Mon, 31 Aug 2030 00:00:00 GMT";   // cookie作成
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