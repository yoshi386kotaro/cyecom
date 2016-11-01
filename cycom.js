L.YahooTileLayer = function(url, options) {
  var tileLayer = new L.TileLayer(url, options);
  tileLayer.getTileUrl = function (tilePoint) {
    var zoom = this._getZoomForUrl();
    var shift = zoom - 1;
    var x = tilePoint.x;
    var y = Math.pow(2, shift) - 1 - tilePoint.y;
    this._adjustTilePoint(tilePoint);
    return L.Util.template(this._url, L.Util.extend({
      s: this._getSubdomain(tilePoint),
      z: zoom + 1,
      x: x,
      y: y
    }, this.options));
  };

  return tileLayer;
};

// 現在地
var geolocation = [35.171659428, 136.887724786];
if( navigator.geolocation )
{
	// 現在位置を取得できる場合の処理
  navigator.geolocation.getCurrentPosition(
    function(position){
      geolocation = [position.coords.latitude, position.coords.longitude];
      init(geolocation);
    } ,
    function(error){
      init(geolocation);
    } ,
    {
      "enableHighAccuracy": false ,
      "timeout": 8000 ,
      "maximumAge": 5000 ,
    }
  ) ;
}

var intervalGps;
var intervalAmagumo;

/*
 * 初期化処理
 * @param position 位置情報
 */
function init (position){
  // 地図の設定
  var map = L.map('map').setView(geolocation, 17);
  map.addControl(L.control.scale({imperial:false}));

  // 現在地アイコン
  var myIcon = L.icon({iconUrl:"img/bike.png", iconSize:[60,60]});
  var marker = L.marker(geolocation,{icon:myIcon});
  map.addLayer(marker);

  //--------------
  // ベースレイヤ
  //--------------
  //OSMレイヤー
  var baseLayerOSM =
    L.tileLayer(
      //'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',  //カラー
      'http://www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png', //モノクロ
      {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18
      }
    ).addTo(map);

  //地理院地図レイヤー
  var baseLayerChiriin =
    L.tileLayer(
      'http://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
      {
        attribution: "<a href='http://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html' target='_blank'>国土地理院</a>"
      }
    );

  // OSM CycleMap
  var baseLayerOSMCycle =
    L.tileLayer(
      'http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png',
      {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18
      }
    );

  // GoogleMap
  var baseLayerGooglemap = new L.Google('ROADMAP');

  // GoogleMapサテライト
  var baseLayerGooglemapSatelite = new L.Google('SATELLITE');

  // GoogleMapハイブリッド
  var baseLayerGooglemapHybrid = new L.Google('HYBRID');

  // MapFan RPG
  var baseLayerMapFanRPG =
    L.tileLayer(
      'http://mfapi-map.mapfan.com/v1/map?LAYER=SiCREW&STYLE=_null&TILEMATRIX=EPSG:3857:{z}&TILEROW={y}&TILECOL={x}&format=image%2Fpng&data=std&mapstyle=rpg_pc&logo=off&lang=ja',
      {
        attribution: 'Map data &copy; <a href="http://mapfan.net">MapFan.net</a>',
        maxZoom: 19
      }
    );

  // MapFan 古地図
  var baseLayerMapFanAntique =
    L.tileLayer(
      'http://mfapi-map.mapfan.com/v1/map?LAYER=SiCREW&STYLE=_null&TILEMATRIX=EPSG:3857:{z}&TILEROW={y}&TILECOL={x}&format=image%2Fpng&data=std&mapstyle=antique_pc&logo=off&lang=ja',
      {
        attribution: 'Map data &copy; <a href="http://mapfan.net">MapFan.net</a>',
        maxZoom: 19
      }
    );

  // Yahoo!地図
  var baseLayerYahooBasic =
    L.YahooTileLayer(
      'http://m.map.c.yimg.jp/m?r=1&style=base:material&x={x}&y={y}&z={z}&logo=on',
      {
        attribution: 'Map data &copy; <a href="http://maps.yahoo.co.jp">Yahoo!地図</a>',
        maxZoom: 19
      }
    );
  // Yahoo!地図
  var baseLayerYahooMonotone =
    L.YahooTileLayer(
      'http://m.map.c.yimg.jp/m?r=1&style=base:monotone&x={x}&y={y}&z={z}',
      {
        attribution: 'Map data &copy; <a href="http://maps.yahoo.co.jp">Yahoo!地図</a>',
        maxZoom: 19
      }
    );
  // Yahoo!地形図
  var baseLayerYahooTopographic =
  L.YahooTileLayer(
    'http://m.map.c.yimg.jp/m?r=1&style=base:topographic&x={x}&y={y}&z={z}',
    {
      attribution: 'Map data &copy; <a href="http://maps.yahoo.co.jp">Yahoo!地図</a>',
      maxZoom: 19
    }
  );

  baseLayer = {
    "OSM":baseLayerOSM,
    "OSM Cycle":baseLayerOSMCycle,
    "国土地理院":baseLayerChiriin,
    "GoogleMap":baseLayerGooglemap,
    "GoogleMapサテライト":baseLayerGooglemapSatelite,
    "GoogleMapハイブリッド":baseLayerGooglemapHybrid,
    "MapFan RPG":baseLayerMapFanRPG,
    "古地図":baseLayerMapFanAntique,
    "Yahoo!地図":baseLayerYahooBasic,
    "Yahoo!地図（モノトーン）":baseLayerYahooMonotone,
    "Yahoo!地図（地形図）":baseLayerYahooTopographic
  };

  //--------------
  // Overlayレイヤ
  //--------------
  //var OverlayLayer = L.layerGroup();
  // ログレイヤ
  var overlayGpxLogLayer =
    new L.GPX('759239093.gpx', {
      async: true,
      marker_options: {
        startIconUrl: '',
        endIconUrl: '',
        shadowUrl: '',
        opacity:0.3,
        dashArray: [10, 10]   //動作しない・・・
      }
    });//.addTo(OverlayLayer);//addTo(map);

  // ルート
  var overlayGpxRouteLayer =
    //new L.GPX('route.gpx', {
    //new L.GPX('http://latlonglab.yahoo.co.jp/route/get?id=1875c8cd56a2c918eff24406544e0f60&format=gpx', {
    new L.GPX('http://latlonglab.yahoo.co.jp/route/get?id=cdd9c624ca71506ec5fa8dc1c2a1ce9e&format=gpx', {
        async: true,
      marker_options: {
        startIconUrl: 'img/pin-icon-start.png',
        endIconUrl: 'img/pin-icon-end.png',
        shadowUrl: 'img/pin-shadow.png'
      },
      polyline_options: {
        opacity:0.8,
        color:'red'
      }
    });//.addTo(OverlayLayer);//addTo(map);

  // Yahoo!地形図
  var overayAmagumo =
  L.YahooTileLayer(
    createAmagumoUrl(),
    {
      attribution: 'Map data &copy; <a href="http://maps.yahoo.co.jp">Yahoo!地図</a>',
      opacity: 0.5,
      minZoom: 1,
      maxZoom: 18,
      isPng: true
    }
  );

  overlayLayer =  {
    "ログ":overlayGpxLogLayer,
    "ルート":overlayGpxRouteLayer,
    "雨雲":overayAmagumo
  };

  L.control.layers(baseLayer,overlayLayer,{collapsed:true}).addTo(map);

  var isActiveLog = false ;
  var isActiveAmagumo = false ;
  var timeLastGetAmagumo = new Date().getTime();
  map.on('overlayadd', function(event){
    if (event.name == "ログ") {
      isActiveLog = true;
    } else if (event.name == "雨雲") {
      isActiveAmagumo = true;
    }
  });
  map.on('overlayremove', function(event){
    if(event.name == "ログ"){
      isActiveLog = false;
    }else if(event.name == "雨雲"){
      isActiveAmagumo = false;
    }
  });
  var popup = null;
  map.on('click',function(event){
    if(popup != null) map.removeLayer(popup);

    lat = event.latlng.lat;
    lng = event.latlng.lng
    //alert("Lat, Lon : " + lat + ", " + lng);

    popup = L.popup(
      {
        maxWidth:730,
        minWidth:600,
        maxHeight:350,
        keepInView:true,
      }
    ).setLatLng(event.latlng)
      .setContent(
                 '<img class="streetview" src="https://maps.googleapis.com/maps/api/streetview?size=170x300&location=' + lat + ',' + lng + '&heading=270&pitch=0&fov=90" />'
                 +'<img class="streetview" src="https://maps.googleapis.com/maps/api/streetview?size=170x300&location=' + lat + ',' + lng + '&heading=0&pitch=0&fov=90" />'
                 +'<img class="streetview" src="https://maps.googleapis.com/maps/api/streetview?size=170x300&location=' + lat + ',' + lng + '&heading=90&pitch=0&fov=90" />'
                 +'<img class="streetview" src="https://maps.googleapis.com/maps/api/streetview?size=170x300&location=' + lat + ',' + lng + '&heading=180&pitch=0&fov=90" />'
               ).openOn(map);

  });


  interval = setInterval(function() {
      // TODO 現在地をAJAXで取得からWebSocketに変更
      $.ajax({
        url:"currentGeoLocation.py",
        type:"GET",
        dataType: 'json',
        timeout:3600
      }).done(function(data, status, xhr){
        // 現在地で更新
        map.removeLayer(marker);
        marker = L.marker(data,{icon:myIcon});
        map.addLayer(marker);
        if(! $("#lockBtn").prop('checked')) {
          //map.setView(data);
          map.panTo(data);
        }
      }).fail(function(xhr, status, error){
        $("#log").append("xhr.status = " + xhr.status + "<br>");          // 例: 404
        $("#log").append("xhr.statusText = " + xhr.statusText + "<br>");  // 例: Not Found
        $("#log").append("status = " + status + "<br>");                  // 例: error
        $("#log").append("error = " + error + "<br>");                    // 例: Not Found
      });

      if(isActiveLog) {
        overlayGpxLogLayer.reload();
      }
      if(isActiveAmagumo && new Date().getTime() - timeLastGetAmagumo >= 300000) { //5分以上経過していたら取り直す
        overayAmagumo.setUrl(createAmagumoUrl());
        overayAmagumo.reload();
        timeLastGetAmagumo = new Date().getTime();
      }
  },2000);
}

/*
 * 雨雲URLの作成
 * @return 雨雲URL
 */
function createAmagumoUrl() {
  //雨雲リクエスト日付の作成
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth() + 1;
  var day = now.getDate();
  var hours = now.getHours();
  var minutes = now.getMinutes();

  if (month < 10) month = '0' + month;
  if (day < 10) day = '0' + day;
  if (hours < 10) hours = '0' + hours;
  minutes *= 0.1;
  minutes = Math.floor(minutes);
  minutes *= 10;
  if (minutes < 10) minutes = '0' + minutes;
  return 'http://weather.map.c.yimg.jp/weather?x={x}&y={y}&z={z}&size=256&date=' + year + month + day + hours + minutes;
}

/*
 * インターバルの停止
 */
function stopInterval() {
  clearInterval(interval);
}
