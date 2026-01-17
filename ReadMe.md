## 🔗 Live App
Explore it here: [Mumbai NDVI Change Detection](https://maitratiwari.users.earthengine.app/view/change-detection-ndvi)

---

# NDVI Change Detection 🌱

This project uses Google Earth Engine to track vegetation change in Mumbai over time.  
By comparing Sentinel‑2 satellite images from different years, it highlights areas of vegetation **loss**, **gain**, and **stable**. The app also provides histograms to visualize NDVI differences, shapefile exports for GIS work, and machine learning methods like **KNN classification** for deeper analysis.

---

## ✨ Features
- NDVI calculation for multiple years  
- Change detection maps (loss, gain, stable)  
- Interactive histogram of NDVI differences  
- Export masks as shapefiles for GIS use  
- KNN classification for clustering change patterns  
- Simple UI with dropdowns, toggles, and charts  

---

## 🚀 How to Use
1. Open the script in the Earth Engine Code Editor.  
2. Select the start and end years from the dropdown menu.  
3. Click **Run Change Detection**.  
4. Explore the results on the map:
   - Red = vegetation loss  
   - Green = vegetation gain  
   - Gray/White = stable areas  
5. View the NDVI histogram in the side panel.  
6. Export shapefiles via the **Tasks tab** for further analysis in QGIS/ArcGIS.  

---

## 📊 Methods
- **NDVI Differencing**: Compares vegetation index between two time periods.  
- **Threshold Masks**: Classifies pixels into loss, gain, or stable categories.  
- **KNN Classification**: Groups spectral changes into clusters for advanced analysis.  

---

## 📌 Applications
- Urban planning and monitoring green cover  
- Environmental change studies  
- Academic research in remote sensing and GIS  
- Policy support for sustainable development  

---

## 📎 Notes
- Built with Google Earth Engine.  
- Requires an Earth Engine account to run.  
- Outputs can be exported to Google Drive and then used in GIS software.  

---

## 📜 License
MIT License – free to use, modify, and share.
