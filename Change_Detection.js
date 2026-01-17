// IMPORTS & STUDY AREA
var india = ee.FeatureCollection('FAO/GAUL/2015/level2');

var mumbaiFC = india
  .filter(ee.Filter.eq('ADM0_NAME', 'India'))
  .filter(ee.Filter.eq('ADM1_NAME', 'Maharashtra'))
  .filter(
    ee.Filter.or(
      ee.Filter.eq('ADM2_NAME', 'Mumbai'),
      ee.Filter.eq('ADM2_NAME', 'Mumbai City'),
      ee.Filter.eq('ADM2_NAME', 'Mumbai Suburban'),
      ee.Filter.eq('ADM2_NAME', 'Greater Mumbai')
    )
  );

var mumbai = mumbaiFC.union().geometry();
Map.centerObject(mumbai, 9);

// CLOUD MASK & PREPROCESS
function maskS2Clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
              .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  var scaled = image.select(['B2','B3','B4','B8','B11','B12']).divide(10000);
  return image.addBands(scaled, null, true).updateMask(mask);
}

function prepS2(start, end) {
  var img = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(mumbai)
    .filterDate(start, end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(maskS2Clouds)
    .median()
    .clip(mumbai);

  // Mask water using NDWI
  var ndwi = img.normalizedDifference(['B3','B8']);
  img = img.updateMask(ndwi.lt(0.3)); // keep non-water

  return img;
}

// UI PANELS
var controlPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {position: 'top-left', padding: '8px', width: '250px'}
});

var chartPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {position: 'top-right', padding: '8px', width: '400px'}
});

// UI elements
var year1 = ui.Select({
  items: ['2018', '2019', '2020'],
  placeholder: 'Start Year',
  value: '2019'
});
var year2 = ui.Select({
  items: ['2022', '2023', '2024'],
  placeholder: 'End Year',
  value: '2023'
});

// Month dropdown (single month only)
var monthSelect = ui.Select({
  items: ['October', 'March'],
  placeholder: 'Select Month',
  value: 'October'
});

var runButton = ui.Button('Run Change Detection');

// Add controls to left panel
controlPanel.add(ui.Label('Mumbai NDVI Change Detection'));
controlPanel.add(year1);
controlPanel.add(year2);
controlPanel.add(monthSelect);
controlPanel.add(runButton);

// Add panels to map
Map.add(controlPanel);
Map.add(chartPanel);

// Helper function for month dates
function getMonthDates(year, monthChoice) {
  if (monthChoice === 'October') {
    return [year + '-10-01', year + '-10-31'];
  } else if (monthChoice === 'March') {
    return [year + '-03-01', year + '-03-31'];
  }
}

// MAIN ANALYSIS FUNCTION
function runAnalysis() {
  Map.layers().reset();
  Map.centerObject(mumbai, 9);

  var monthChoice = monthSelect.getValue();
  var dates1 = getMonthDates(year1.getValue(), monthChoice);
  var dates2 = getMonthDates(year2.getValue(), monthChoice);

  var img_t1 = prepS2(dates1[0], dates1[1]);
  var img_t2 = prepS2(dates2[0], dates2[1]);

  var ndvi_t1 = img_t1.normalizedDifference(['B8','B4']).rename('NDVI_T1');
  var ndvi_t2 = img_t2.normalizedDifference(['B8','B4']).rename('NDVI_T2');

  // Mask non-vegetation (NDVI < 0.2)
  ndvi_t1 = ndvi_t1.updateMask(ndvi_t1.gt(0.2));
  ndvi_t2 = ndvi_t2.updateMask(ndvi_t2.gt(0.2));

  var ndvi_diff = ndvi_t2.subtract(ndvi_t1).rename('NDVI_Change');

  var lossMask = ndvi_diff.lt(-0.1).selfMask().rename('Loss');
  var gainMask = ndvi_diff.gt(0.1).selfMask().rename('Gain');
  var stableMask = ndvi_diff.gte(-0.1).and(ndvi_diff.lte(0.1)).selfMask().rename('Stable');

  var diffVis = {min: -0.5, max: 0.5, palette: ['red','gray','green']};

  Map.addLayer(ndvi_diff, diffVis, 'NDVI Change');
  Map.addLayer(lossMask, {palette: ['red']}, 'Vegetation Loss');
  Map.addLayer(gainMask, {palette: ['green']}, 'Vegetation Gain');
  Map.addLayer(stableMask, {palette: ['white']}, 'Stable');

  // HISTOGRAM
  var chart = ui.Chart.image.histogram({
    image: ndvi_diff,
    region: mumbai,
    scale: 30,
    maxPixels: 1e6
  }).setOptions({
    title: 'NDVI Change Histogram',
    hAxis: {title: 'NDVI Difference'},
    vAxis: {title: 'Pixel Count'},
    series: [{color: 'green'}]
  });

  chartPanel.clear();
  chartPanel.add(ui.Label('NDVI Change Histogram'));
  chartPanel.add(chart);

  // EXPORT MASKS AS SHAPEFILES
  Export.table.toDrive({
    collection: lossMask.reduceToVectors({
      geometry: mumbai,
      scale: 30,
      geometryType: 'polygon',
      eightConnected: false,
      labelProperty: 'loss',
      reducer: ee.Reducer.countEvery()
    }),
    description: 'Mumbai_Loss_Shapes_' + year1.getValue() + '_' + year2.getValue(),
    fileFormat: 'SHP'
  });

  Export.table.toDrive({
    collection: gainMask.reduceToVectors({
      geometry: mumbai,
      scale: 30,
      geometryType: 'polygon',
      eightConnected: false,
      labelProperty: 'gain',
      reducer: ee.Reducer.countEvery()
    }),
    description: 'Mumbai_Gain_Shapes_' + year1.getValue() + '_' + year2.getValue(),
    fileFormat: 'SHP'
  });

  Export.table.toDrive({
    collection: stableMask.reduceToVectors({
      geometry: mumbai,
      scale: 30,
      geometryType: 'polygon',
      eightConnected: false,
      labelProperty: 'stable',
      reducer: ee.Reducer.countEvery()
    }),
    description: 'Mumbai_Stable_Shapes_' + year1.getValue() + '_' + year2.getValue(),
    fileFormat: 'SHP'
  });
}

// BUTTON 
runButton.onClick(runAnalysis);
