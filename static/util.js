export function getUuid() {
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
    return arr['uuid'];
}