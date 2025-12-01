// grabbing random image from json file
let answerLatLng = null;
let answerYear = null;
let rounds = [];
function getImage() {
    fetch('https://raw.githubusercontent.com/claresk/test/refs/heads/main/data.json')
       .then(response => response.json())
       .then(data => {
            let random = Math.floor(Math.random()*data.length);
            
            if (rounds.length === data.length) {
                alert('oops, you made it through the whole photo library!');
                rounds = [];
            } else {
                while (rounds.includes(random)) {
                    random = Math.floor(Math.random()*data.length);
                }
            }
            let round = data[random];
            rounds.push(random);
            document.getElementById("img").src = round.photo;
            answerLatLng = L.latLng(round.lat, round.lng);
            answerYear = round.year;
           })
    };
getImage();

// creating map
const map = L.map('map').setView([40.709994, -73.974521], 11);
L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 16,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// defining marker
const icon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconAnchor:   [12, 41],
});

// function to place marker on click
let marker = null;
function placeMarker(e) {
    if (marker !== null) {
        marker.setLatLng(e.latlng);
    } else {
        marker = L.marker(e.latlng, {icon: icon}).addTo(map);
        document.getElementById('submitbutton').textContent = "submit";
    }
}
map.on('click', placeMarker);

// timeline slider
const slider = document.getElementById("slider");
const year = document.getElementById("year");
slider.value = 1900;
slider.addEventListener("input", () => {
    year.textContent = slider.value;
});

// update position of label
function moveLabel() {
    const pctx = (slider.value-slider.min) / (slider.max-slider.min);
    const x = pctx*(slider.offsetWidth-30);
    year.style.left = `${x}px`;
}
moveLabel();
slider.addEventListener("input", moveLabel);


// submitting & checking answer on click of submit button
let text; let m; let y; let praise;
document.getElementById('submitbutton').addEventListener('click', () => {
    if (marker === null) {
        document.getElementById('submitbutton').textContent = "place a marker first!";
        return;
    } else {
        // change it so you can't move the marker anymore
        map.off('click', placeMarker);
        slider.disabled = true; 

        // print result text where button was, add replay button
        const miles = Math.round(marker.getLatLng().distanceTo(answerLatLng)*0.000621371 * 10)/10 
        const feet = Math.round(miles*5280);
        const years = Math.abs(slider.value-answerYear);
        
        if (feet < 500 && years === 0) {
            text = 'Perfect!';
        } else if (miles > 50) {
                text = 'Are you sure you know where New York is?';
        } else {
            if (miles === 1) {m = ''} else {m = 's'};
            if (years === 1) {y = ''} else {y = 's'};
            if (miles < 2 && years < 5) {
                praise = 'Nice job! ';
            } else if (miles <= 2 || years <= 5) {
                praise = 'Almost! ';
            } else {
                praise = 'Good try. '
            };

            if (miles < 0.5) {
                text = `${praise}You're ${feet} feet and ${years} year${y} away.`
            } else {
                text = `${praise}You're ${miles} mile${m} and ${years} year${y} away.`
            };
        };
        
        const submit = document.getElementById("submit");
        const result = document.createElement("div");
        result.id = 'result';
        submit.replaceWith(result);
        result.textContent = text;
        const replayButton = document.createElement("button");
        replayButton.id = 'replaybutton';
        replayButton.textContent = "↻ replay";
        result.appendChild(replayButton);

        // add line and circle for correct location & zoom to fit
        line = L.polyline([answerLatLng, marker.getLatLng()], {
            color: 'black',
            weight: 4,
            dashArray: '10, 10', 
            dashOffset: '0',
            smoothFactor: 1
        }).addTo(map);
        circle = L.circleMarker(answerLatLng, {
            radius: 10,
            color: 'black',
            fillColor: 'rgb(115, 216, 135)',
            fillOpacity: 1
        }).addTo(map);
        map.fitBounds(line.getBounds(), {padding: [10, 10]});
        
        // add line and circle for correct year
        function showCorrectYear() {
            const timeline = document.getElementById("timeline"); // same wrapper
            const dot = document.getElementById("correctDot");
            const label = document.getElementById("correctYear");
            const line = document.getElementById("line");
            const pctx = (answerYear-slider.min) / (slider.max-slider.min);
            const sliderRect = slider.getBoundingClientRect();
            const timelineRect = timeline.getBoundingClientRect();
            const x = (sliderRect.left - timelineRect.left) + pctx*(timeline.clientWidth-24);
            
            // placing correct answer dot & label
            dot.style.left = `${x}px`;
            dot.style.opacity = 1;
            slider.style.opacity = 1;
            label.style.left = `${x}px`;
            label.textContent = answerYear;
            year.textContent = null;
            
            // drawing a line between two dots
            //const pctxG = (slider.value-slider.min) / (slider.max-slider.min);
            //const xG = pctxG*(slider.offsetWidth);
            //const left = Math.min(xG, x) + 20;
            //const length = Math.abs(x - xG) - 20;
            //line.style.left = `${left}px`;
            //line.style.width = `${length}px`;
            //line.style.opacity = 1;
        }
        showCorrectYear()
        window.addEventListener("resize", () => {
            if (typeof answerYear !== "undefined") {
                showCorrectYear(answerYear);
            }
        });

        // on replay button click, remove marker, line, and circle. re-add original button & functionality
        replayButton.addEventListener("click", () => {
            map.removeLayer(marker);
            marker = null;
            map.removeLayer(line);
            map.removeLayer(circle);
            map.on('click', placeMarker);
            slider.disabled = false; 
            year.textContent = slider.value;
            document.getElementById("correctDot").style.opacity = 0;
            document.getElementById("line").style.opacity = 0;
            document.getElementById("correctYear").textContent = null;
            result.replaceWith(submit);
            map.setView([40.709994, -73.974521], 11);
            getImage();
        });
    };
});
