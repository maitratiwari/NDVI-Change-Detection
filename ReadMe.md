## 🔗 Live App
Explore it here: [Mumbai NDVI Change Detection](https://maitratiwari.users.earthengine.app/view/change-detection-ndvi)

---

<<<<<<< HEAD
# NDVI Change Detection 🌱

This project uses Google Earth Engine to track vegetation change in Mumbai over time.  
By comparing Sentinel‑2 satellite images from different years, it highlights areas of vegetation **loss**, **gain**, and **stability**. The app also provides histograms to visualize NDVI differences, shapefile exports for GIS work, and machine learning methods like **KNN classification** for deeper analysis.
=======
# 🌿 Mumbai NDVI Change Detection (Google Earth Engine)

## 📍 Overview
This project performs vegetation change detection over Mumbai using Sentinel-2 surface reflectance imagery in Google Earth Engine (GEE). NDVI values from two selected years and a chosen month are compared to identify vegetation **gain**, **loss**, and **stable** regions.
>>>>>>> 1534318 (Important Changes made)

## 🗺️ Study Area
The analysis covers Mumbai administrative regions (Mumbai, Mumbai City, Mumbai Suburban, and Greater Mumbai), merged into a single study boundary for processing.

## ⚙️ Method Summary
The workflow includes:

- Sentinel-2 filtering by region, date, and cloud coverage  
- Cloud and cirrus masking using QA60 band  
- Reflectance scaling and median compositing  
- Water masking using NDWI  
- NDVI computation and masking of non-vegetation (NDVI < 0.2)  
- NDVI differencing between two time periods  
- Classification into vegetation gain, loss, and stable zones  
- Histogram generation for NDVI change distribution  
- Export of change results as polygon shapefiles

## 📊 Interface & Outputs
A GEE user interface allows selection of start year, end year, and analysis month (March or October), then runs the workflow interactively.

Outputs include:
- NDVI change visualization
- Vegetation gain, loss, and stable layers
- NDVI change histogram
- Exported shapefiles for GIS analysis
