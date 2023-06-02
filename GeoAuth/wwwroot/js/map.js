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


var mapView = new ol.View({
  center: [3830000, 5653800],
  zoom: 8.2,
});

const map = new ol.Map({
  target: 'map',
  view: mapView,
  layers: [
    new ol.layer.Group({
      title: 'Базовый слой',
      layers: [new ol.layer.Tile({
        source: new ol.source.OSM(),
        crossOrigin: "Anonymous",
        type: 'base',
        visible: true,
        title: 'OSMStandard'
      }),
      new ol.layer.Tile({
        source: new ol.source.OSM({
          url: 'http://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
          crossOrigin: "Anonymous"
        }),
        type: 'base',
        visible: false,
        title: 'OSMHumanitarian'
      }),
      new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          crossOrigin: "Anonymous"
        }),
        type: 'base',
        visible: false,
        title: 'ArcGIS Map'
      }),
      new ol.layer.Tile({
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
  overlays: [overlay],//
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
}
)
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

  let downLayer = [];
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
              //geoportal%3A
              url: 'http://localhost:8080/geoserver/' + userId + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + value + '&maxFeatures=50&outputFormat=application/json',
              format: new ol.format.GeoJSON(),
              attributions: '@geoserver'
            }),
            title: titleName
          })
          personalLayerGroup.getLayers().push(newlayer); //добавление слоя в группу
          //downLayer.push(newlayer);
        })
      })
      map.addLayer(personalLayerGroup);
      listLayer();
    }
  })
}



function listLayer() {
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

  var delFlag = false;
  map.addControl(delControl);

  delButton.addEventListener("click", () => {
    delButton.classList.toggle("cliked");
    delFlag = !delFlag;
    var personalLayers = personalLayerGroup.getLayers().array_;
    personalLayers.forEach(layer => {
      if (layer.values_.visible == true) {
        $.ajax({
          type: "DELETE",
          headers: {
            "Authorization": "Basic " + btoa("admin" + ":" + "geoserver")
          },
          url: 'http://localhost:8080/geoserver/rest/workspaces/' + userId + '/datastores/' + layer.values_.title + '/?recurse=true',
          success: function (result) {
            console.log(result);
            console.log("успех");
            personalLayerGroup.getLayers().pop(layer);
          },
          error: function (error) {
            console.log(error);
            console.log("error");
          }
        })

      }
    });
    layerSwitcher.renderPanel();
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

lenthButton.addEventListener("click", () => {
  lenthButton.classList.toggle("cliked");
  lengthFlag = !lengthFlag;
  document.getElementById("map").style.cursor = "default";
  if (lengthFlag) {
    map.removeInteraction(draw);
    addInteraction('LineString');
  } else {
    map.removeInteraction(draw);
    source.clear();
    const elements = document.getElementsByClassName("ol-tooltip ol-tooltip-static");
    while (elements.length > 0) elements[0].remove();

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
areaButton.addEventListener("click", () => {
  areaButton.classList.toggle("cliked");
  areaFlag = !areaFlag;
  document.getElementById("map").style.cursor = "default";
  if (areaFlag) {
    map.removeInteraction(draw);
    addInteraction('Polygon');
  } else {
    map.removeInteraction(draw);
    source.clear();
    const elements = document.getElementsByClassName("ol-tooltip ol-tooltip-static");
    while (elements.length > 0) elements[0].remove();

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
const vector = new ol.layer.Vector({
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

/**
 * Currently drawn feature.
 * @type {ol.Feature}
 */
var sketch;


/**
 * The help tooltip element.
 * @type {Element}
 */
var helpTooltipElement;


/**
 * Overlay to show the help messages.
 * @type {ol.Overlay}
 */
var helpTooltip;


/**
 * The measure tooltip element.
 * @type {Element}
 */
var measureTooltipElement;


/**
 * Overlay to show the measurement.
 * @type {ol.Overlay}
 */
var measureTooltip;


/**
 * Message to show when the user is drawing a polygon.
 * @type {string}
 */
var continuePolygonMsg = 'Нажмите, чтобы продолжить рисовать полигон';


/**
 * Message to show when the user is drawing a line.
 * @type {string}
 */
var continueLineMsg = 'Нажмите, чтобы продолжить рисовать линию';


/**
 * Handle pointer move.
 * @param {ol.MapBrowserEvent} evt
 */
var pointerMoveHandler = function (evt) {
  if (evt.dragging) {
    return;
  }
  /** @type {string} */

};

map.on('pointermove', pointerMoveHandler);

$(map.getViewport()).on('mouseout', function () {
  $(helpTooltipElement).addClass('hidden');
});


var draw; // global so we can remove it later
function addInteraction(intType) {
  draw = new ol.interaction.Draw({
    source: source,
    type: intType,
    style: new ol.style.Style({
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
          color: 'rgba(0, 0, 0, 0.7)'
        }),
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        })
      })
    })
  });
  map.addInteraction(draw);

  createMeasureTooltip();

  var listener;

  draw.on('drawstart', function (evt) {
    // set sketch
    sketch = evt.feature;

    /** @type {import("../src/ol/coordinate.js").Coordinate|undefined} */
    let tooltipCoord = evt.coordinate;

    listener = sketch.getGeometry().on('change', function (evt) {
      const geom = evt.target;
      let output;
      if (geom instanceof ol.geom.Polygon) {
        output = formatArea(geom);
        tooltipCoord = geom.getInteriorPoint().getCoordinates();
      } else if (geom instanceof ol.geom.LineString) {
        output = formatLength(geom);
        tooltipCoord = geom.getLastCoordinate();
      }
      measureTooltipElement.innerHTML = output;
      measureTooltip.setPosition(tooltipCoord);
    });
  });

  draw.on('drawend', function () {
    measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
    measureTooltip.setOffset([0, -7]); //смещение
    sketch = null;
    measureTooltipElement = null;
    createMeasureTooltip();
  });
}
/**
 * Creates a new measure tooltip
 */
function createMeasureTooltip() {
  if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
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
  map.addOverlay(measureTooltip);
}

/**
 * Let user change the geometry type.
 * @param {Event} e Change event.
 */

/**
 * format length output
 * @param {ol.geom.LineString} line
 * @return {string}
 */
var formatLength = function (line) {
  var length;
  length = Math.round(line.getLength() * 100) / 100;
  var output;
  if (length > 100) {
    output = (Math.round(length / 1000 * 100) / 100) +
      ' ' + 'km';
  } else {
    output = (Math.round(length * 100) / 100) +
      ' ' + 'm';
  }
  return output;
};
/**
 * format length output
 * @param {ol.geom.Polygon} polygon
 * @return {string}
 */
var formatArea = function (polygon) {
  var area;
  area = polygon.getArea();
  var output;
  if (area > 10000) {
    output = (Math.round(area / 1000000 * 100) / 100) +
      ' ' + 'km<sup>2</sup>';
  } else {
    output = (Math.round(area * 100) / 100) +
      ' ' + 'm<sup>2</sup>';
  }
  return output;
};
addInteraction();