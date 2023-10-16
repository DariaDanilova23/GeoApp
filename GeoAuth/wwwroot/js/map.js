var mainContainer = document.getElementsByClassName("content-place");
var mapClass = document.createElement("div");
mapClass.setAttribute('class', 'map');
mapClass.setAttribute('id', 'map');
mainContainer[0].appendChild(mapClass);
//-------------------
const container = document.createElement("div");
container.setAttribute('id', 'popup');
container.setAttribute('class', 'ol-popup');
mainContainer[0].appendChild(container);

const closer = document.createElement("a");
closer.setAttribute('id', 'popup-closer');
closer.setAttribute('class', 'ol-popup-closer');
container.appendChild(closer);

const content = document.createElement("div");
content.setAttribute('id', 'popup-content');
container.appendChild(content);

const overlay = new ol.Overlay({
  element: container,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};


var mapView = new ol.View({ //определение области карты, которая будет видна при загрузке сайта
  center: [3830000, 5653800],
  zoom: 8.2,
});

const map = new ol.Map({ //создание карты
  target: 'map',
  view: mapView,
  layers: [
    new ol.layer.Group({ //обраделение группы возможных базовых слоев
      title: 'Базовый слой',
      layers: [new ol.layer.Tile({ // базовый слой OSMStandard
        source: new ol.source.OSM(),
        crossOrigin: "Anonymous",
        type: 'base',
        visible: true,
        title: 'OSMStandard'
      }),
      new ol.layer.Tile({  // базовый слой OSMHumanitarian
        source: new ol.source.OSM({
          url: 'http://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
          crossOrigin: "Anonymous"
        }),
        type: 'base',
        visible: false,
        title: 'OSMHumanitarian'
      }),
      new ol.layer.Tile({ // базовый слой ArcGIS Map
        source: new ol.source.XYZ({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          crossOrigin: "Anonymous"
        }),
        type: 'base',
        visible: false,
        title: 'ArcGIS Map'
      }),
      new ol.layer.Tile({ // базовый слой googleMap
        source: new ol.source.XYZ({
          url: 'http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}',
          crossOrigin: "Anonymous"
        }),
        type: 'base',
        visible: false,
        title: 'googleMap'
      })
      ]
    })],
  overlays: [overlay],// overlay для popUp координаты
  target: 'map'
});
//-------------
var coorButton = document.createElement('button');
var img = document.createElement('img');
img.className = "info";
coorButton.appendChild(img);
coorButton.className = "myButton";
coorButton.id = "coorButton";

var coorElement = document.createElement('div');
coorElement.className = "containerButtonDiv";
coorElement.id = "coorButtonDiv";
coorElement.appendChild(coorButton);


var coorControl = new ol.control.Control({
  element: coorElement
});

var coorFlag = false;

coorButton.addEventListener("click", () => {
  coorButton.classList.toggle("cliked");
  coorFlag = !coorFlag;
  map.on('singleclick', function (evt) {
    if ((lengthFlag == false) && (areaFlag == false) && (coorFlag == true)) {
      const coordinate = evt.coordinate;
      const hdms = ol.coordinate.toStringHDMS(ol.proj.toLonLat(coordinate));
      content.innerHTML = '<p>Координата:</p><code>' + hdms + '</code>';
      overlay.setPosition(coordinate);
    }
  });
});
map.addControl(coorControl);
//-----------------------
var zoom = new ol.control.Zoom({ zoomInLabel: '+', zoomOutLabel: '-' });
map.addControl(zoom);

var zoom_ex = new ol.control.ZoomToExtent({
  extent: [
    3700000, 5500000,
    3900000, 5700800
  ]
});
map.addControl(zoom_ex);
//-----------Координаты мышки---------//
var mousePosition = new ol.control.MousePosition({
  className: 'mousePosition',
  projection: 'EPSG:4326',//EPSG:4326
  coordinateFormat: function (coordinate) { return ol.coordinate.format(coordinate, '{y}, {x}', 6); }
});
mapClass.onmouseover = function () {
  map.addControl(mousePosition);
}
mapClass.onmouseleave = function () {
  map.removeControl(mousePosition);
}
//------------------Масштаб--------------//
let control;

control = new ol.control.ScaleLine({
  units: "metric",
  bar: true,
  steps: parseInt(6, 10),
  text: true,
  minWidth: 140,
});
map.addControl(control);
//----------Контроль слоев------//
var layerSwitcher = new ol.control.LayerSwitcher({
  activationMode: 'click',
  startActive: true,
  tipLabel: 'Слои',
  groupSelectStyle: 'children',
  collapseTipLabel: 'Скрыть'
});
map.addControl(layerSwitcher);
//----------------------

//ИЗОБРАЖЕНИЕ 
const rasterLayerGroup = new ol.layer.Group({ //определение группы растровых слоев
  'title': 'Растровые слои'
})
map.addLayer(rasterLayerGroup); //Добавление группы слоев на карту
$.ajax({
  type: "GET",
  url: "http://localhost:8080/geoserver/rastergeo/wms?request=getCapabilities", // ссылка для запроса растровых слоев
  dataType: "xml",
  success: function (xml) {
    $(xml).find('Layer').each(function () {
      $(this).find('Layer').each(function () { // цикл для каждого названия слоя
          $(this).find('Name').each(function () {
            var parentNode=$(this).parent(); //получение родительского узла
            if(parentNode[0].nodeName!="Style"){ // проверка не является ли название, названием стиля
            var raster =new ol.layer.Image({
              title: $(this).text(),
              source: new ol.source.ImageWMS({ // получение ресурса слоя 
                url:'http://localhost:8080/geoserver/rastergeo/wms',
                params:{
                  'LAYERS' :$(this).text()
                }
              }),
              serverType:'geoserver'
            })
            rasterLayerGroup.getLayers().push(raster); //добавление слоя в группу растров
            layerSwitcher.renderPanel(); //обновление переключателя слоев
          }
          })
        })
      });
  },
  error: function (error) {
    console.log("error");
    console.log(error);
  }
});


const overlayLayerGroup = new ol.layer.Group({
  'title': 'Тематические слои'
})
map.addLayer(overlayLayerGroup); //Добавление группы слоев на карту
$.ajax({
  type: "GET",
  url: "http://localhost:8080/geoserver/geoportal/wfs?request=getCapabilities",
  dataType: "xml",
  success: function (xml) {
    $(xml).find('FeatureType').each(function () {
      var elementRespond = $(this);
      $(this).find('Name').each(function () { // цикл для каждого названия слоя
        var value = $(this).text(); //получение слоя
        var titleName = elementRespond.find('Title').text(); //Получение названия слоя
        var newlayer = new ol.layer.Vector({
          source: new ol.source.Vector({
            url: 'http://localhost:8080/geoserver/geoportal/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + value + '&maxFeatures=50&outputFormat=application/json',
            format: new ol.format.GeoJSON(),
            attributions: '@geoserver'
          }),
          title: titleName
        })
        overlayLayerGroup.getLayers().push(newlayer); //добавление слоя в группу
        layerSwitcher.renderPanel(); //Обновление переключателя слоев
      })
    })
  }
})


const personalLayerGroup = new ol.layer.Group({
  'title': 'Личные слои'
})
//---------------------------
var userId = document.getElementById("userInfoID").value; //Получение id пользователя
if (userId != " ") {
  $.ajax({
    type: 'GET',
    url: 'http://localhost:8080/geoserver/' + userId + '/wfs?request=getCapabilities',
    dataType: "xml",
    success: function (xml) {
      $(xml).find('FeatureType').each(function () {
        var elementRespond = $(this);
        $(this).find('Name').each(function () { // цикл для каждого названия слоя
          var value = $(this).text(); //получение слоя
          var titleName = elementRespond.find('Title').text(); //Получение названия слоя
          var newlayer = new ol.layer.Vector({
            source: new ol.source.Vector({
              url: 'http://localhost:8080/geoserver/' + userId + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + value + '&maxFeatures=50&outputFormat=application/json',
              format: new ol.format.GeoJSON(),
              attributions: '@geoserver'
            }),
            title: titleName
          })
          personalLayerGroup.getLayers().push(newlayer); //добавление слоя в группу
          layerSwitcher.renderPanel(); //Обновление переключателя слоев
          //downLayer.push(newlayer);
          if (personalLayerGroup.getLayers().getLength() > 0) {
            map.addLayer(personalLayerGroup);
          };
        })
      })
      deleteLayer();
    }
  })
}


function deleteLayer() {
  //Создание кнопки на панели инструментов
  layerSwitcher.renderPanel();
  var delButton = document.createElement('button');
  var img = document.createElement('img');
  img.className = "rubbish"
  delButton.appendChild(img);
  delButton.className = "myButton";
  delButton.id = "delButton";
  var delElement = document.createElement('div');
  delElement.className = "containerButtonDiv";
  delElement.id = "delButtonDiv";
  delElement.appendChild(delButton);

  var delControl = new ol.control.Control({
    element: delElement
  });
  map.addControl(delControl);
  //------
  var delFlag = false;
  delButton.addEventListener("click", () => { //обработчик нажатия кнопки
    delFlag = !delFlag;
    if (confirm("Вы уверены что хотите удалить выбранные слои?")) {
      var personalLayers = personalLayerGroup.getLayers().array_; //получение слое из группы
      personalLayers.forEach(layer => {
        if (layer.values_.visible == true) { //проверка активен ли слой
          $.ajax({ // ajax запрос на удаление
            type: "DELETE",
            headers: {
              "Authorization": "Basic " + btoa("admin" + ":" + "geoserver")
            },
            url: 'http://localhost:8080/geoserver/rest/workspaces/' + userId + '/datastores/' + layer.values_.title + '/?recurse=true',

            //url: 'http://localhost:8080/geoserver/rest/layers/'+userId+':'+layer.values_.title +'/?recurse=true',
            success: function (result) {
              location.reload();
              if (personalLayerGroup.getLayers().getLength() == 0) { //если удаляяемый слой последний
                map.removeLayer(personalLayerGroup); // удаляем всю группу
              };
              layerSwitcher.renderPanel();
            },
            error: function (error) {
              console.log(layer.values_);
              console.log(layer);
              console.log("error");
            }
          })

        }
      });

    }
  });
}

//---------------
var lenthButton = document.createElement('button');
var img = document.createElement('img');
img.className = "ruler"
lenthButton.appendChild(img);
lenthButton.className = "myButton";
lenthButton.id = "lenthButton";

var lenthElement = document.createElement('div');
lenthElement.className = "containerButtonDiv";
lenthElement.id = "lenthButtonDiv";
lenthElement.appendChild(lenthButton);

var lengthControl = new ol.control.Control({
  element: lenthElement
});

var lengthFlag = false;

lenthButton.addEventListener("click", () => { //обработчик кнопки "Измерение длины"
  lenthButton.classList.toggle("cliked"); //добавление или удаление класса для подсветки кнопки
  lengthFlag = !lengthFlag;
  document.getElementById("map").style.cursor = "default";
  if (lengthFlag) { //если кнопка активна
    map.removeInteraction(draw); //удаление старых отрисовок
    addInteraction('LineString');//добавление отрисовки линии
  } else { //если кнопка не активна
    map.removeInteraction(draw);
    source.clear();
    const elements = document.getElementsByClassName("ol-tooltip ol-tooltip-static");
    while (elements.length > 0) elements[0].remove(); //удаление таблички с измеренной длиной 
  }
})
map.addControl(lengthControl);

//для измерения площади
var areaButton = document.createElement('button');
var img2 = document.createElement('img');
img2.className = "square"
areaButton.appendChild(img2);
areaButton.className = "myButton";
areaButton.id = "areaButton";

var areaElement = document.createElement('div');
areaElement.className = "containerButtonDiv";
areaElement.id = "areaButtonDiv";
areaElement.appendChild(areaButton);

var areaControl = new ol.control.Control({
  element: areaElement
});

var areaFlag = false;
areaButton.addEventListener("click", () => {//обработчик кнопки "Измерение площади"
  areaButton.classList.toggle("cliked"); //добавление или удаление класса для подсветки кнопки
  areaFlag = !areaFlag;
  document.getElementById("map").style.cursor = "default";
  if (areaFlag) { //если кнопка активна
    map.removeInteraction(draw); //удаление старых отрисовок
    addInteraction('Polygon'); //добавление отрисовки полигона
  } else { //если кнопка не активна
    map.removeInteraction(draw); //удаление старых отрисовок
    source.clear();
    const elements = document.getElementsByClassName("ol-tooltip ol-tooltip-static");
    while (elements.length > 0) elements[0].remove(); //удаление таблички с измеренной площадью 

  }
})
map.addControl(areaControl);

//-------------
var exportButton = document.createElement('button');
exportButton.id = "export-png";
exportButton.className = "btn btn-outline-dark";
exportButton.className = "myButton";
var faExportButton = document.createElement('i');
faExportButton.className = "fa fa-download";
var exportImg = document.createElement('img');
exportImg.className = "exportImg";
exportButton.appendChild(exportImg);
var imgDownload = document.createElement('a');
imgDownload.id = "image-download";
imgDownload.download = "map.png";

var exportElement = document.createElement('div');
exportElement.className = "containerButtonDiv";
exportElement.id = "exportButtonDiv";
exportElement.appendChild(exportButton);

var exportControl = new ol.control.Control({
  element: exportElement
});
exportButton.addEventListener("click", () => {
  map.once('rendercomplete', function () { // действие после загрузки карты
    const mapCanvas = document.createElement('canvas');
    const size = map.getSize();//получаем размер карты
    mapCanvas.width = size[0];// присваиваем canvas размеры карты
    mapCanvas.height = size[1];
    const mapContext = mapCanvas.getContext('2d');//генерирует двумерный контекст рисования, который будет связан с указанным canvas 
    Array.prototype.forEach.call(
      map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer'),
      function (canvas) {
        if (canvas.width > 0) {
          const opacity =
            canvas.parentNode.style.opacity || canvas.style.opacity; //  получаем непрозрачность родительского элемента или самого элемента
          mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);// если текущее значение прозрачности(альфа-канала графического объекта) и непрозрачности canvas неопределенны присваиваем 1 иначе присваиваем canvas
          let matrix;
          const transform = canvas.style.transform;// получаем параметры преобразования из матрицы преобразования стиля
          if (transform) {
            matrix = transform
              .match(/^matrix\(([^\(]*)\)$/)[1]
              .split(',')
              .map(Number);
            //Применяем преобразование к контексту карты экспорта
          } else {
            matrix = [
              parseFloat(canvas.style.width) / canvas.width, //parseFloat преобразует строку в число с плавающей точкой для исключения единиц измерения
              0,
              0,
              parseFloat(canvas.style.height) / canvas.height,
              0,
              0,
            ];
          }
          CanvasRenderingContext2D.prototype.setTransform.apply( //настраиваем текущий контекст
            mapContext,
            matrix
          );
          const backgroundColor = canvas.parentNode.style.backgroundColor;
          if (backgroundColor) {
            mapContext.fillStyle = backgroundColor;
            mapContext.fillRect(0, 0, canvas.width, canvas.height); // рисуем "залитый" прямоугольник. 
          }
          mapContext.drawImage(canvas, 0, 0); //создание изображения на холсте
        }
      }
    );
    mapContext.globalAlpha = 1;
    mapContext.setTransform(1, 0, 0, 1, 0, 0);
    const link = imgDownload;
    link.href = mapCanvas.toDataURL();
    link.click();
  });
  map.renderSync();
});
map.addControl(exportControl); //Добавление кнопки экспорта на карту

var source = new ol.source.Vector();
const vector = new ol.layer.Vector({ //слой с выделенными полигонами слоя запроса
  source: source,
  style: {
    'fill-color': 'rgba(255, 255, 255, 0.2)',
    'stroke-color': '#ffcc33',
    'stroke-width': 2,
    'circle-radius': 7,
    'circle-fill-color': '#ffcc33',
  },
});
map.addLayer(vector);
//-------------Фильтр-------------------------------------
var attQueryDiv = document.createElement("div");
attQueryDiv.setAttribute('class', 'attQueryDiv');
attQueryDiv.setAttribute('id', 'attQueryDiv');
mainContainer[0].appendChild(attQueryDiv);


var headerDiv = document.createElement("div");
headerDiv.setAttribute('class', 'headerDiv');
headerDiv.setAttribute('id', 'headerDiv');
attQueryDiv.appendChild(headerDiv);

var headerLable = document.createElement("lable");
headerLable.innerHTML = "Запрос атрибутов";
headerDiv.appendChild(headerLable);
//---------------------------
var selectLayerLable = document.createElement("lable");
selectLayerLable.innerHTML = "Выбрать слой";
attQueryDiv.appendChild(selectLayerLable);

var selectLayer = document.createElement("select");
selectLayer.setAttribute('name', 'selectLayer');
selectLayer.setAttribute('id', 'selectLayer');
attQueryDiv.appendChild(selectLayer);

var attQryRun = document.createElement("button");
attQryRun.setAttribute('type', 'button');
attQryRun.setAttribute('id', 'attQryRun');
attQryRun.setAttribute('class', 'attQryRun');
attQryRun.setAttribute('onclick', 'attributeQuery()');
attQryRun.innerHTML = "Найти";
attQueryDiv.appendChild(attQryRun);

tabDiv = document.createElement("div");
tabDiv.className = "attListDiv";
tabDiv.id = "attListDiv";
document.body.appendChild(tabDiv);
//-----------------
var selectorButton = document.createElement('button');
var img = document.createElement('img');
img.className = "selector"
selectorButton.appendChild(img);
selectorButton.className = "myButton";
selectorButton.id = "selectorButton";

var selectorElement = document.createElement('div');
selectorElement.className = "containerButtonDiv";
selectorElement.id = "selectorButtonDiv";
selectorElement.appendChild(selectorButton);

var selectorControl = new ol.control.Control({
  element: selectorElement
});

//внимание
var geojson;
var featureOverlay;
var bolIdentify = false;
var selectorFlag = false;
var bolClick = false;
selectorButton.addEventListener("click", () => { //обработчик нажатия кнопки просмотра атрибутов
  selectorButton.classList.toggle("cliked"); //добавление или удаление 
  selectorFlag = !selectorFlag;
  if (selectorFlag) { //если кнопка активна
    if (geojson) {
      geojson.getSource().clear();
      map.removeLayer(geojson);//удаление слоя со старыми данными
    }
    if (featureOverlay) {
      featureOverlay.getSource().clear();
      map.removeLayer(featureOverlay);//удаление слоя со старыми данными
    }
    attQueryDiv.style.display = 'block'; //отображение таблицв атрибутов
    if (bolClick == false) { //если кнопка нажата в первый раз 
      addMapLayerList(); //вызов ф-ии получения списка слоев 
      bolClick = true;
    };
  }
  else {
    attQueryDiv.style.display = 'none'; //скрытие div для таблицы атрибутов
    tabDiv.style.display = 'none'; //скрытие таблицы атрибутов

    if (geojson) { //удаление слоя со старыми данными
      geojson.getSource().clear();
      map.removeLayer(geojson);
    }
    if (featureOverlay) { //удаление слоя со старыми данными
      featureOverlay.getSource().clear();
      map.removeLayer(featureOverlay);
    }
  }
})
map.addControl(selectorControl);

function addMapLayerList() { //получение списка слоев
  $(document).ready(function () {
    $.ajax({ //ajax запрос geoserver для получения слоев с workspace geoportal
      type: "GET",
      url: "http://localhost:8080/geoserver/geoportal/wfs?request=getCapabilities",
      dataType: "xml",
      success: function (xml) {
        var select = $('#selectLayer');
        select.append("<option class='ddindent' value=''></option>"); // добавление пустого варианта в выпадающий список
        $(xml).find('FeatureType').each(function () {
          var elementRespond = $(this);
          $(this).find('Name').each(function () {
            var title = elementRespond.find('Title').text(); //получение названия слоя
            var value = $(this).text();//получение значения слоя
            //console.log(value);
            select.append("<option class='ddindent' value='" + value + "'>" + title + "</option>"); // добавление пустого варианта в выпадающий список
          })
        })
      }
    });
  });
}
// Фильрация после выбора слоя

$(function () {
  document.getElementById('attQryRun').onclick = function () { //обработчик кнопики "Найти" при выводе атрибутов
    if (featureOverlay) {
      featureOverlay.getSource().clear();
      map.removeLayer(featureOverlay);
    }

    var layer = document.getElementById("selectLayer"); //получение выбранного слоя
    if (layer.options.selectedIndex == 0) { //если слой не выбран
      alert("Выберите слой"); //просьба выбрать слой
    }
    else { // если слой выбран
      var value_layer = layer.options[layer.selectedIndex].value; //получаем зачение выбранного слоя
      var url = "http://localhost:8080/geoserver/geoportal/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=" + value_layer + "&outputFormat=application/json"; //url слоя на geoserver
      newaddGeoJsonToMap(url); //ф-ия подсвечивающая на карте полигоны выбранного слоя
      newpopulateQueryTable(url); //ф-ия создания таблицы атрибутов
      setTimeout(function () { newaddRowHandlers(url); }, 3000); // ф-ия обработчик выбора атрибута слоя
    }
  }
});

function newaddGeoJsonToMap(url) {//ф-ия подсвечивающая на карте полигоны выбранного слоя
  if (geojson) { //если слой существует
    geojson.getSource().clear();
    map.removeLayer(geojson); //удаление старого слоя
  }

  var style = new ol.style.Style({ //стилизация отображения слоя на карте
    stroke: new ol.style.Stroke({
      color: '#FFFF00',
      width: 3
    }),
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({
        color: '#FFFF00'
      })
    })
  });
  geojson = new ol.layer.Vector({ //определение слоя с подсветкой
    source: new ol.source.Vector({
      url: url,
      format: new ol.format.GeoJSON()
    }),
    style: style,
  });
  geojson.getSource().on('addfeature', function () { //обработчик добавления объектов
    map.getView().fit(
      geojson.getSource().getExtent(),
      { duration: 1590, size: map.getSize(), maxZoom: 21 }
    );
  });
  map.addLayer(geojson);
};

function newpopulateQueryTable(url) { //ф-ия создаания таблицы атрибутов
  if (typeof attributePanel !== 'undefined') {
    if (attributePanel.parentElement !== null) {
      attributePanel.close();
    }
  }

  $.getJSON(url, function (data) {
    var col = []; //определение списка с названиями колонок слоя
    col.push('id'); //добавление колонки с названием id
    for (var i = 0; i < data.features.length; i++) {
      for (var key in data.features[i].properties) {
        if (col.indexOf(key) === -1) {
          col.push(key); // добавление название колонки слоя в список
        }
      }
    }

    var table = document.createElement("table");//создание таблицы
    table.setAttribute("class", "table table-bordered table-hover table-condensed");
    table.setAttribute("id", "attQryTable");

    var tr = table.insertRow(-1); //добавление поля в таблицу

    for (var i = 0; i < col.length; i++) { //для каждого элемента в списке с названиями колонок слоя
      var th = document.createElement("th");//создание шапки таблицы
      th.innerHTML = col[i];
      tr.appendChild(th);// добавление шапки в таблицу
    }

    for (var i = 0; i < data.features.length; i++) {
      tr = table.insertRow(-1);
      for (var j = 0; j < col.length; j++) {
        var tabCell = tr.insertCell(-1);
        if (j == 0) { tabCell.innerHTML = data.features[i]['id']; } //добавление атрибута id
        else {
          tabCell.innerHTML = data.features[i].properties[col[j]]; // добавление атрибутов в таблицу
        }
      }
    }
    var delTab = document.getElementById("attQryTable");
    if (delTab) {
      tabDiv.removeChild(delTab);  //удаление таблицы
    }

    tabDiv.appendChild(table); //добавление таблицы
    tabDiv.style.display = "block"; //отображение таблицы
    tabDiv.scrollIntoView(); //фокус экрана на таблице
  });

};

function newaddRowHandlers() { // ф-ия обработчик выбора атрибута слоя
  var highlightStyle = new ol.style.Style({ //определение стиля выделенного полигона
    fill: new ol.style.Fill({
      color: 'rgba(184, 184, 184, 0.4)'
    }),
    stroke: new ol.style.Stroke({
      color: '#FF553E',
      width: 3,
    }),
    image: new ol.style.Circle({
      radius: 10,
      fill: new ol.style.Fill({
        color: '#FF553E'
      })
    })
  });

  featureOverlay = new ol.layer.Vector({ //слой с выделенным полигоном
    source: new ol.source.Vector(),
    map: map,
    style: highlightStyle
  })
  var table = document.getElementById('attQryTable'); //получение таблицы
  var rows = table.rows;
  var heads = document.getElementsByTagName('th'); //получение шапки таблицы
  var col_no;
  for (var i = 0; i < heads.length; i++) {
    var head = heads[i];
    if (head.innerHTML == 'id') {
      col_no = i + 1;
    }
  }

  for (i = 0; i < rows.length; i++) {
    rows[i].onclick = function () {
      return function () {
        featureOverlay.getSource().clear();

        $(function () {
          $("attQryTable td").each(function () {
            $(this).parent("tr").css("background-color", "white"); //определение цвета ячеек
          });
        });

        var cell = this.cells[col_no - 1];
        var id = cell.innerHTML;
        /*
        $(document).ready(function () {
          $("attQryTable td:nth-child(" + col_no + ")").each(function () {
            if ($(this).text() == id) { 
              $(this).parent("tr").css("background-color", "#d1d8e2"); //определение цвета ячеек 
            }
          })
        });*/


        var features = geojson.getSource().getFeatures();

        for (i = 0; i < features.length; i++) {
          if (features[i].getId() == id) {
            featureOverlay.getSource().addFeature(features[i]);
            featureOverlay.getSource().on('addfeature', function () { //обработчик добавления объекта к слою выделения полигона
              map.getView().fit(
                featureOverlay.getSource().getExtent(),
                { duration: 1500, size: map.getSize(), maxZoom: 24 } //приближение к слою
              );
            });
          }
        }
      };
    }
      (rows[i])
  }
}

//------------------------
/**
 * Текущий нарисованный объект.
 * @type {ol.Feature}
 */
var sketch;

/**
 * Элемент всплывающей подсказки измерения.
 * @type {Element}
 */
var measureTooltipElement;


/**
 * Overlay для изобрадения измерений.
 * @type {ol.Overlay}
 */
var measureTooltip;

/**
 * Обработчик джижения мышки.
 * @param {ol.MapBrowserEvent} evt
 */
var pointerMoveHandler = function (evt) {
  if (evt.dragging) {
    return;
  }
  /** @type {string} */

};

map.on('pointermove', pointerMoveHandler);


var draw;
function addInteraction(intType) { //Функция отрисовки элементов на карте
  draw = new ol.interaction.Draw({
    source: source,
    type: intType,
    style: new ol.style.Style({ //определение стиля отрисовки
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 0, 0.5)',
        lineDash: [10, 10],
        width: 2
      }),
      image: new ol.style.Circle({
        radius: 5,
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 0, 0, 0.5)'
        }),
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        })
      })
    })
  });
  map.addInteraction(draw); //добавление отрисовки на карту

  createMeasureTooltip();


  draw.on('drawstart', function (evt) { //ф-ия начала отрисовки
    // set sketch
    sketch = evt.feature;

    /** @type {import("../src/ol/coordinate.js").Coordinate|undefined} */
    let tooltipCoord = evt.coordinate; //определение координаты

    listener = sketch.getGeometry().on('change', function (evt) {
      const geom = evt.target;
      let output;
      if (geom instanceof ol.geom.Polygon) { //если  отрисовываем полигон
        output = formatArea(geom); // вызов ф-ии которая форматирует определенную площадь 
        tooltipCoord = geom.getInteriorPoint().getCoordinates();
      } else if (geom instanceof ol.geom.LineString) { //если отрисовываем линию
        output = formatLength(geom); // вызов ф-ии которая форматирует определенную длину 
        tooltipCoord = geom.getLastCoordinate();
      }
      measureTooltipElement.innerHTML = output; // отображение выделенной длины
      measureTooltip.setPosition(tooltipCoord); // на позиции координат
    });
  });

  draw.on('drawend', function () { //ф-ия завершения отрисовки
    measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
    measureTooltip.setOffset([0, -7]); //смещение
    sketch = null;
    measureTooltipElement = null;
    createMeasureTooltip();
  });
}

function createMeasureTooltip() { //Создает новую подсказку измерений
  if (measureTooltipElement) {//если уже существует подсказка
    measureTooltipElement.parentNode.removeChild(measureTooltipElement); //убрать ее
  }
  measureTooltipElement = document.createElement('div');
  measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
  measureTooltip = new ol.Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: 'bottom-center',
    stopEvent: false,
    insertFirst: false,
  });
  map.addOverlay(measureTooltip); //добавление подсказки на карту
}

/**
 * Позвольяет пользователю изменить тип геометрии.
 * @param {Event} e 
 */

/**
 * форматирование отображения длины
 * @param {ol.geom.LineString} line
 * @return {string}
 */
var formatLength = function (line) {
  var length;
  length = Math.round(line.getLength() * 100) / 100;
  var output;
  if (length > 100) { //если длина больше 100
    output = (Math.round(length / 1000 * 100) / 100) +
      ' ' + 'km'; //отображаем в км
  } else { //если длина меньше 100
    output = (Math.round(length * 100) / 100) +
      ' ' + 'm'; //отображаем в м
  }
  return output;
};
/**
 * форматирование отображения площади
 * @param {ol.geom.Polygon} polygon
 * @return {string}
 */
var formatArea = function (polygon) {
  var area;
  area = polygon.getArea();
  var output;
  if (area > 10000) { //если площадь больше 10000
    output = (Math.round(area / 1000000 * 100) / 100) +
      ' ' + 'km<sup>2</sup>';// отображение площади в км2
  } else {
    output = (Math.round(area * 100) / 100) +
      ' ' + 'm<sup>2</sup>';// отображение площади в м2
  }
  return output;
};
addInteraction();