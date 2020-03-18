var triggerName = window.ontouchstart === null ? "touchstart" : "click";
var player = new SMF.Player();
// player.setLoop(true);
// player.setCC111Loop(true);
player.setMasterVolume(16383 * 0.5);

var soundEnabled = false;
window.addEventListener(triggerName, function() {
  soundEnabled = true;
  document.body.classList.add("active");
});

window.addEventListener("load", main, false);
function main() {
  var _app = document.title;
  var _url = "https://midi-is-dead.now.sh/";
  var _wml;
  var _track;
  var _zip = null;
  var _initilized = false;
  var _parts = {
    wml: document.querySelector("#wml"),
    theme: document.querySelector("#theme"),
    title: document.querySelector("#title"),
    next: document.querySelectorAll("header button")[0],
    toggle: document.querySelectorAll("header button")[1],
    share: document.querySelectorAll("header button")[2]
  };
  _parts.next.addEventListener(triggerName, playRandom, false);
  _parts.toggle.addEventListener(triggerName, toggle, false);
  _parts.theme.addEventListener(
    "change",
    function() {
      playAtTheme();
    },
    false
  );
  _parts.title.addEventListener(
    "change",
    function() {
      playAtTitle();
    },
    false
  );
  _parts.wml.addEventListener("change", setWML, false);
  _parts.share.addEventListener(triggerName, share, false);
  window.addEventListener("popstate", playAtSearch, false);
  window.addEventListener(
    "message",
    function(ev) {
      if (ev.data === "endoftrack") {
        next();
      }
    },
    false
  );

  var disablePlay = false;
  playAtSearch();

  function setSearch(event) {
    var query =
      "?" +
      _parts.theme.value +
      "=" +
      _parts.title.value +
      "&" +
      _parts.wml.value;
    if (disablePlay) {
      disablePlay = true; //【１】
    }
    if (location.search != query) {
      window.history.pushState(true, undefined, query); //event.state=arguments[0]
    }
  }
  function setWML(event) {
    if (_wml != _parts.wml.value) {
      var option = _parts.wml.querySelectorAll("option")[
        _parts.wml.selectedIndex
      ];
      player.stop();
      player.setWebMidiLink(option.getAttribute("url"));
      player.setMasterVolume(
        16383 * Number(document.querySelector("#volume").value)
      );

      if (_wml) {
        document.body.classList.add("busy");
        setTimeout(function() {
          document.body.classList.remove("busy");
          playAtTitle();
        }, 3000);
      }

      _wml = _parts.wml.value;
    }
    if (event) {
      setSearch(event);
    }
    document.title =
      _parts.title.value +
      " - " +
      _parts.theme.value +
      " by " +
      _app +
      "(" +
      _parts.wml.value +
      ")";
  }
  function playAtSearch(event) {
    if (disablePlay) {
      return (disablePlay = false);
    } //【１】
    var theme;
    var title;
    var queries = {};
    location.search
      .substr(1)
      .split("&")
      .forEach(function(query) {
        var param = query.split("=");
        queries[decodeURIComponent(param[0])] = decodeURIComponent(param[1]);
      });
    var keys = Object.keys(queries);

    _parts.theme.querySelectorAll("option").forEach(function(option) {
      if (-1 < keys.indexOf(option.value)) {
        theme = option.value;
        if (queries[theme]) {
          title = queries[theme];
        }
      }
    });
    if (-1 < keys.indexOf("A320U")) {
      _parts.wml.value = "A320U";
    }
    if (-1 < keys.indexOf("Yamaha XG")) {
      _parts.wml.value = "Yamaha XG";
    }

    setWML();
    var track = theme + "=" + title;
    if (_track != track) {
      _track = track;
      player.stop();
      playAtTheme(event, theme, title);
    }
  }
  function playAtTheme(event, theme, title) {
    var theme = theme || _parts.theme.value;
    _parts.theme.value = theme;
    readTheme("./theme/" + theme + ".zip", function() {
      _parts.title.value = title;
      if (title == null) {
        _parts.title.selectedIndex = ~~(Math.random() * _parts.title.length);
      }
      playAtTitle(event);
    });
  }
  function playAtTitle(event) {
    var option = _parts.title.querySelectorAll("option")[
      _parts.title.selectedIndex
    ];
    var path = option.getAttribute("path");

    if (_zip) {
      player.stop();
      setTimeout(function() {
        player.loadMidiFile(_zip.decompress(path));
        setTimeout(function() {
          if (_initilized && event == null) {
            //ボタン操作時のみ
            setSearch();
          }
          document.title =
            _parts.title.value +
            " - " +
            _parts.theme.value +
            " by " +
            _app +
            "(" +
            _parts.wml.value +
            ")";

          var play = function() {
            player.play();

            // FIX: https://midi-is-dead.now.sh/?虚ろいの都=【KU-BO】ori_bt4&A320U 音量が0の状態で再生されるバグ
            // 非常に不安定な方法だが、ボリュームをセットするタイミングが未定義のため、1秒待って音量を再設定する
            setTimeout(function() {
              player.setMasterVolume(
                16383 * Number(document.querySelector("#volume").value)
              );
            }, 1000);
          };
          if (soundEnabled) {
            play();
          } else {
            window.addEventListener(triggerName, play, { once: true });
          }
          _initilized = true;
        }, 10);
      }, 10);
    }
  }
  function playRandom(event) {
    _parts.title.selectedIndex = ~~(Math.random() * _parts.title.length);
    playAtTitle();
    event && event.preventDefault();
  }
  function next(event) {
    _parts.title.selectedIndex++;
    if (_parts.title.selectedIndex == -1) {
      _parts.title.selectedIndex = 0;
    }
    playAtTitle();
    event && event.preventDefault();
  }
  function toggle(event) {
    if (player.pause) {
      player.play();
    } else {
      player.stop();
    }
    event && event.preventDefault();
  }
  function share(event) {
    var theme = encodeURIComponent(_parts.theme.value);
    var title = encodeURIComponent(_parts.title.value);
    var url = "https://twitter.com/intent/tweet";
    url += "?text=" + encodeURIComponent(document.title);
    url +=
      "&url=" +
      escape(_url + "?" + theme + "=" + title + "&" + _parts.wml.value);
    window.open(url, "tweet", "resizable=no,scrollbars=yes,status=no");
    event && event.preventDefault();
  }
  function readTheme(url, callback) {
    _parts.title.innerHTML = null;

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.addEventListener("load", function(ev) {
      var binary = new Uint8Array(xhr.response);
      _zip = new Zlib.Unzip(binary);
      _zip.getFilenames().forEach(function(path) {
        var name = path.split("/").pop();
        var title = name.substr(0, name.lastIndexOf("."));
        var ext = name.substr(name.lastIndexOf(".") + 1);
        if ("mid" == ext.toLowerCase().substr(0, 3)) {
          var option = document.createElement("option");
          option.setAttribute("path", path);
          option.innerHTML = title;
          _parts.title.appendChild(option);
        }
      });
      callback && callback();
    });
    xhr.send();
  }
}
NodeList.prototype.forEach = Array.prototype.forEach;
