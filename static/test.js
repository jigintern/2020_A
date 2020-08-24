const btnSubscribe = document.getElementById('btnSubscribe');
const btnUnSubscribe = document.getElementById('btnUnSubscribe');
const textInstanceIdToken = document.getElementById('textInstanceIdToken');
const sendWebPushArea = document.getElementById('sendWebPushArea');
const sendWebPush = document.getElementById('sendWebPush');

// メッセージング オブジェクトの取得
const messaging = firebase.messaging();

// アプリにウェブ認証情報を設定する
messaging.usePublicVapidKey("BNciTurF7WXKOWdzpMpi7OHTc7_1TPW26NlVXw4dgKlkKuDgovsOu_5CW1UUG5sD3J3RcXcy5AU1KP8MYQyONQM");

// 権限要求
function requestPermission() {
    // 通知を受信する権限を要求する
    messaging.requestPermission().then(function() {
        // 現在の登録トークンの取得
        messaging.getToken().then(function(token) {
            textInstanceIdToken.value = token;
            btnSubscribe.style.display = 'none';
            btnUnSubscribe.style.display = 'block';
            sendWebPushArea.style.display = 'block';
            const req = {
                "id": "0",
                "token": token
            }
            const url = "http://localhost:8881/api/checktoken";
            const res = await fetchJSON(url, req);
            console.log(res);
        }).catch(function(err) {
            textInstanceIdToken.value = 'トークンの取得に失敗しました（' + err + '）。';
        });
    }).catch(function(err) {
        textInstanceIdToken.value = '通知の許可が得られませんでした（' + err + '）。';
    });
}

// トークン削除
function deleteToken() {
    // トークン取得
    messaging.getToken().then(function(currentToken) {
        // トークン削除
        messaging.deleteToken(currentToken).then(function() {
            textInstanceIdToken.value = 'トークンが削除されました';
            btnSubscribe.style.display = 'block';
            btnUnSubscribe.style.display = 'none';
            sendWebPushArea.style.display = 'none';
            sendWebPush.value = '';
        }).catch(function(err) {
            textInstanceIdToken.value = 'トークンの削除に失敗しました（' + err + '）。';
        });
    }).catch(function(err) {
        textInstanceIdToken.value = 'トークンの取得に失敗しました（' + err + '）。';
    });
}

// 初期化
window.onload = function() {
    // イベント登録
    btnSubscribe.onclick = requestPermission;
    btnUnSubscribe.onclick = deleteToken;
    // トークン取得
    messaging.getToken().then(function(currentToken) {
        if (currentToken) {
            // 本来ここでサーバにトークン送る処理
            //sendTokenToServer(currentToken);
            textInstanceIdToken.value = currentToken;
            btnSubscribe.style.display = 'none';
            btnUnSubscribe.style.display = 'block';
            sendWebPushArea.style.display = 'block';
            const req = {
                "id": "0",
                "token": currentToken
            }
            const url = "http://localhost:8881/api/checktoken";
            const res = await fetchJSON(url, req);
            console.log(res);
        } else {
            // トークン無い場合
            textInstanceIdToken.value = '通知の許可をしていません。「通知を許可する」を押してください。';
        }
    }).catch(function(err) {
        textInstanceIdToken.value = 'トークンの取得に失敗しました（' + err + '）。';
    });
};