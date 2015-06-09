//map js file
$( document ).ready(function() {

L.mapbox.accessToken = 'pk.eyJ1IjoiYmxldTIzIiwiYSI6IkhJWXRBYlkifQ.5ljjcelMS1vZ67Xog38rBg';
var initX = -74.2,initY=40.8,initZ=10;
var southWest = L.latLng(40, -75),
    northEast = L.latLng(41.5, -73),
    bounds = L.latLngBounds(southWest, northEast);

var map = L.mapbox.map('map', 'bleu23.6e605f0c', {zoomControl:false, maxBounds:bounds,minZoom:initZ})
    .setView([initY, initX], initZ);
new L.Control.Zoom({ position: 'topright' }).addTo(map);

var clusters = new L.MarkerClusterGroup({
    iconCreateFunction: function (cluster) {
        var markers = cluster.getChildCount();
        return L.divIcon({html: markers, className: 'mycluster', iconSize:L.point(20,20)})
    },
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
        spiderLegPolylineOptions: {weight: 1, color:'#fff'},
        maxClusterRadius:20
    });

var points = omnivore.geojson('data/CSA.geojson', null, L.mapbox.featureLayer());
var zips = L.mapbox.featureLayer(zip);
var boro = L.mapbox.featureLayer(boroughs);

var dayList = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday","DAY"];
var dayLayers = [];
for (var i = 0;i<dayList.length;i++){
    var lyrgrp = L.featureGroup();
    dayLayers.push(lyrgrp);
};

points.on("ready", function(){
    points.eachLayer(function(layer){
        var day = layer.feature.properties.Day.trim();
        var snap = parseInt(layer.feature.properties.SNAP);
        if (day.split(",").length>1){
            var days = day.split(",");
            for (var i=0;i<days.length;i++){
                var index = dayList.indexOf(days[i].trim());
                var dayGroup = dayLayers[index];
                dayGroup.addLayer(layer);
            }
        }else{
            var index = dayList.indexOf(day);
            var dayGroup = dayLayers[index];
            dayGroup.addLayer(layer);
        }
        if (snap == 1){
            layer.setIcon(L.mapbox.marker.icon({
                'marker-color': "#7ec9b1",
                'marker-size': 'small',
                'marker-symbol': ''
            }));
        }else{
            layer.setIcon(L.mapbox.marker.icon({
                'marker-color': '#325047',
                'marker-size': 'small',
                'marker-symbol': ''
            }));
        }
        clusters.addLayer(layer);
    });//points each layer
buildLegend(points);
});//points ready
map.addLayer(clusters);

var scrollTo = 0;
function buildLegend(group){
    $("#locations").empty();
    var pointCt = 0;
    group.eachLayer(function(layer){

        var CSA = layer.feature.properties.CSA.trim();
        var address = layer.feature.properties.Address.trim();
        var day = layer.feature.properties.Day.trim();
        var time = layer.feature.properties.Time.trim();

        if (day.split(",").length>1){
            var days = day.split(",");
            var times = time.split(",");
            var daystring="";
            for (var i=0;i<days.length;i++){
                daystring+=days[i]+", "+times[i]+"<br>";
            }
            daystring = daystring.slice(0,-4);
        }else{
            var daystring = day+", "+time;
        }

        var farm = layer.feature.properties.Farm.trim();
        var worship = parseInt(layer.feature.properties.Worship);
        var compost = parseInt(layer.feature.properties.Compost);
        var snap = parseInt(layer.feature.properties.SNAP);
        var website = layer.feature.properties.Website;
        var price = layer.feature.properties.Price;
        var popup = "<a href='"+website+"' target='_blank'>"+CSA+"</a>"
        layer.bindPopup(popup);

       var entry = "<div id='p"+pointCt+"' class='item'><div class='text'><h2><a target='_blank' href='"+website+"'>"+CSA+"</a></h2><p>"+address+"</p>";
       entry += "<table class='itemtable'><tr><td class='tdname'>Pick-up:</td><td class='tddata dt'>"+daystring+"</td></tr><tr><td class='tdname'>";
       entry += "Partner Farm:</td><td class='tddata'>"+farm+"</td></tr><tr><td class='tdname'>Price:</td><td class='tddata'>"+price+"</td></tr></table>";
        
        if (worship == 1){
            entry += "<div class='icon'><img src='CSA-icons/worship.png' title='Place of Worship' /></div>";
        }
        if (compost == 1){
            entry += "<div class='icon'><img src='CSA-icons/compost.png' title='Onsite Composting' /></div>";
        }
        if (snap == 1){
            entry += "<div class='icon'><img src='CSA-icons/SNAP.png' title='Sliding-scale/SNAP' /></div>";
        }
        entry += "</div></div>"  

        $("#locations").append(entry);

        $("#p"+pointCt).on("click", function(){
            map.setView(layer.getLatLng(), 16);
            layer.openPopup();
        });

        layer.on("click", function(){
            var currScroll = $("#list").scrollTop();
            for (var i=0;i<pointCt;i++){
                var item = $(".item")[i];
                var p = $(item).children('div').children("p").html();
                if (p == address){
                    scrollTo = $(item).offset().top;
                    $("#list").animate({scrollTop:currScroll+scrollTo-110},1000);
                }
            }
        });
        pointCt +=1;
    });//points each layer
}//end build legend

var boroughList = [];
var boroughLayers = [];
boro.eachLayer(function(layer){
    var b = layer.feature.properties.borough;
    layer.bindPopup(b).setStyle({
      fillColor:"#7ec9b1",
      weight:0,
      color:"#ff3333",
      opacity:0.8,
      fillOpacity:0.4
    });
    if (boroughList.indexOf(b)== -1){
        boroughList.push(b);
        var bFL = L.featureGroup();
        layer.addTo(bFL);
        boroughLayers.push(bFL);
    }else{
        var index = boroughList.indexOf(b);
        var bFL = boroughLayers[index];
        layer.addTo(bFL);
    }
});//boro each layer
function boroFlash(index){
    boroughLayers[index].addTo(map)
    setTimeout(function(){
        map.removeLayer(boroughLayers[index]);
    },1600)
}

var zipList = [];
var zipLayers = [];
zips.eachLayer(function(layer){
    var z = layer.feature.properties.postalCode;
    layer.bindPopup(z).setStyle({
      fillColor:"#7ec9b1",
      weight:0,
      color:"#ff3333",
      opacity:0.8,
      fillOpacity:0.4
    });
    if (zipList.indexOf(z)== -1){
        zipList.push(z);
        var zFL = L.featureGroup();
        layer.addTo(zFL);
        zipLayers.push(zFL);
    }else{
        var index = zipList.indexOf(z);
        var zFL = zipLayers[index];
        layer.addTo(zFL);
    }
});//zip each layer
function zipFlash(index){
    zipLayers[index].addTo(map)
    setTimeout(function(){
        map.removeLayer(zipLayers[index]);
    },1600)
}

$("#listToggle").on('click', function (){
    if($(this).hasClass('hide')){
        $(this).removeClass('hide').addClass('show');
        $(this).animate({ left: 0 }, "slow");
        $(this).prop('title', 'Show Sidebar');
        $("#list").animate({ marginLeft: -306, opacity: 0 }, 600);
        $("#legend").animate({ marginLeft: -306, opacity: 0 }, 600);
        $("#dayContainer").animate({left:0},"slow");
        $("#boroContainer").animate({left:0},"slow");
        $("#zipContainer").animate({left:0},"slow");
    }else{
        $(this).removeClass('show').addClass('hide');
        $(this).animate({ left: "320px" }, "slow");
        $(this).prop('title', 'Hide Sidebar');
        $("#list").animate({ marginLeft: 0, opacity: 1 }, 600);
        $("#legend").animate({ marginLeft: 0, opacity: 1 }, 600);
        $("#dayContainer").animate({left:"320px"},"slow");
        $("#boroContainer").animate({left:"320px"},"slow");
        $("#zipContainer").animate({left:"320px"},"slow");
    }
});//list toggle

$("#dayToggle").on("click", function () {
    if ($(this).hasClass('show')){
        $("#dayFilter").show("slide",{ direction: "left" },600);
        $(this).removeClass('show').addClass('hide');
    }else{
        $("#dayFilter").hide("slide",{ direction: "left" },600);
        $(this).removeClass('hide').addClass('show');
    }
});//toggle day filter
$("#boroToggle").on("click", function () {
    if ($(this).hasClass('show')){
        $("#boroFilter").show("slide",{ direction: "left" },600);
        $(this).removeClass('show').addClass('hide');
    }else{
        $("#boroFilter").hide("slide",{ direction: "left" },600);
        $(this).removeClass('hide').addClass('show');
    }
});//toggle boro search
$("#zipToggle").on("click", function () {
    if ($(this).hasClass('show')){
        $("#zipFilter").show("slide",{ direction: "left" },600);
        $(this).removeClass('show').addClass('hide');
    }else{
        $("#zipFilter").hide("slide",{ direction: "left" },600);
        $(this).removeClass('hide').addClass('show');
    }
});//toggle zip search

$("#dayFilter select").on("change", function () {
    map.closePopup();
    clusters.clearLayers();
    var index = $("#dayFilter option:selected").index()-1;
    for (var i=0;i<dayLayers.length;i++){
        if (index == -1){
            clusters.addLayer(points);
            buildLegend(points);
        };
        if (index==i){
            clusters.addLayer(dayLayers[i]);
            buildLegend(dayLayers[i]);
        };   
    }
});// day filter change

$("#boroFilter select").on("change", function() {
    map.closePopup();
    var b = $("#boroFilter option:selected").html();
    if (b=="All City"){
        map.setView([initY,initX],initZ);      
    }else{
        var index = boroughList.indexOf(b);
        map.fitBounds(boroughLayers[index].getBounds());
        boroFlash(index);
    }
});//boro zoom

$("#zipInput").on("keyup", function (event) {
    if (event.keyCode == 13) {
        var zc = $(this).val();
        if(zipList.indexOf(zc)!== -1){
            var index = zipList.indexOf(zc);
            map.fitBounds(zipLayers[index].getBounds());
            zipFlash(index);
        }else{
            console.log("must enter valid zip")
            alert("Must enter valid NYC Zip Code");
        }
    }
});//zip zoom

});//document ready
