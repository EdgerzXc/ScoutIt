## 2024-05-18 - Mapbox setHTML XSS Vulnerability
**Vulnerability:** Cross-Site Scripting (XSS) vulnerability via Mapbox `setHTML()`
**Learning:** Mapbox provides `.setHTML()` for popups, which is commonly paired with ES6 template literals. This creates a severe XSS vector if any of the interpolated variables (e.g., property title, location) contain unescaped user input.
**Prevention:** Always use `.setDOMContent()` for Mapbox popups when dealing with dynamic or user-generated content. Safely construct the DOM nodes using `document.createElement()` and inject values via `.textContent` to ensure natural HTML escaping.
