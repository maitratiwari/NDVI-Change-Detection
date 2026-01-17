// 0. IMPORTS & STUDY AREA
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

// 1. CLOUD MASK & PREPROCESS
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
  return ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(mumbai)
    .filterDate(start, end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(maskS2Clouds)
    .select(['B2','B3','B4','B8','B11','B12'])
    .median()
    .clip(mumbai);
}

// 2. UI ELEMENTS
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
var runButton = ui.Button('Run Change Detection');
var panel = ui.Panel([ui.Label('Mumbai NDVI Change Detection'), year1, year2, runButton]);
Map.add(panel);

// 3. MAIN ANALYSIS FUNCTION
function runAnalysis() {
  Map.clear();
  Map.centerObject(mumbai, 9);

  var start = year1.getValue() + '-01-01';
  var end = year1.getValue() + '-06-30';
  var start2 = year2.getValue() + '-01-01';
  var end2 = year2.getValue() + '-06-30';

  var img_t1 = prepS2(start, end);
  var img_t2 = prepS2(start2, end2);

  var ndvi_t1 = img_t1.normalizedDifference(['B8','B4']).rename('NDVI_T1');
  var ndvi_t2 = img_t2.normalizedDifference(['B8','B4']).rename('NDVI_T2');
  var ndvi_diff = ndvi_t2.subtract(ndvi_t1).rename('NDVI_Change');

  var lossMask = ndvi_diff.lt(-0.1).selfMask().rename('Loss');
  var gainMask = ndvi_diff.gt(0.1).selfMask().rename('Gain');
  var stableMask = ndvi_diff.gte(-0.1).and(ndvi_diff.lte(0.1)).selfMask().rename('Stable');

  var diffVis = {min: -0.5, max: 0.5, palette: ['red','gray','green']};

  Map.addLayer(ndvi_diff, diffVis, 'NDVI Change');
  Map.addLayer(lossMask, {palette: ['red']}, 'Vegetation Loss');
  Map.addLayer(gainMask, {palette: ['green']}, 'Vegetation Gain');
  Map.addLayer(stableMask, {palette: ['white']}, 'Stable');

  // 4. HISTOGRAM
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
  Map.add(panel);
  panel.add(chart);

  // 5. EXPORT MASKS AS SHAPEFILES
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

// 6. BUTTON TRIGGER
runButton.onClick(runAnalysis);
