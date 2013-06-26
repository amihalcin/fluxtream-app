define(["core/Tab",
        "applications/calendar/App", "applications/calendar/tabs/photos/PhotoUtils"], function(Tab, Calendar, PhotoUtils) {

    var maxWidth = 200;
    var maxHeight = 200;
    var ratio = maxWidth / maxHeight;

    var lastTimestamp = null;


    function render(params) {
        params.setTabParam(null);
        this.getTemplate("text!applications/calendar/tabs/photos/photos.html", "photos", function() {
            $(window).resize(); //masonry reorganizes pictures when the window is resized and some tabs can braek the layout, this fixes it
            if (lastTimestamp == params.digest.generationTimestamp && !params.forceReload){
                params.doneLoading();
                return;
            }
            else
                lastTimestamp = params.digest.generationTimestamp;
            digest = params.digest;
            connectorEnabled = params.connectorEnabled;
            setup(digest,connectorEnabled,params.doneLoading);

        });
    }

    /*function render(digest, timeUnit) {
        this.getUrl("/tabs/photos", "photos", null, true);
    }*/

    var connectorEnabled;
    var digest;

    var doneLoading;
    var thumbnailGroupTemplate;

    function setup(digest, cEn, dl){
        App.loadMustacheTemplate("applications/calendar/tabs/photos/photosTemplate.html","thumbnailGroup", function(tTemplate){
            thumbnailGroupTemplate = tTemplate;
            doneLoading = dl;
            $("#photoTab").empty();
            var noPhotos = true;
            var photos = [];
            for (var connectorName in digest.cachedData){
                if (digest.cachedData[connectorName].hasImages){
                    noPhotos = false;
                    photos = _.union(photos, digest.cachedData[connectorName]);
                }
            }
            if (noPhotos){
                showNoPhotos();
            } else{
                photos.sort(function(a,b) {return a.start- b.start;});
                onDataReceived(photos);
            }
            if (doneLoading != null)
                doneLoading();
        });
    }

    function showNoPhotos(){
        $("#photoTab").empty();
        $("#photoTab").append("<div class=\"emptyList\">(no photos)</div>");
    }

    function onDataReceived(photos){
        var data = [];
        $("#photoTab").empty();
        for (var i = 0; i < photos.length; i++){
            if (!photos[i].hasImage)
                continue;
            for (var j = 0; j < digest.selectedConnectors.length; j++){
                var found = false;
                for (var k = 0; !found &&  k < digest.selectedConnectors[j].facetTypes.length; k++){
                   found = digest.selectedConnectors[j].facetTypes[k] == photos[i].type;
                }
                if (found){
                   if (connectorEnabled[digest.selectedConnectors[j].connectorName]){
                       data[data.length] = photos[i];
                       break;//to avoid duplicates
                   }
                }
            }
        }
        for (var i = 0; i < data.length; i++){
            data[i].active = i == 0;
            data[i].id = i;
        }
        $("#photoTab").empty();
        if (data.length == 0){
            showNoPhotos();
            return;
        }
        var carouselHTML = PhotoUtils.getCarouselHTML(digest);
        var currentGroup = [];
        var currentDate = null;
        for (var i = 0; i < data.length; i++){
           var date = App.formatDate(data[i].start + digest.timeZoneOffset,false,true);
           if (currentDate == null){
               currentDate = date;
           }
           else if (currentDate != date) {
               $("#photoTab").append(thumbnailGroupTemplate.render({date:currentDate,photos:currentGroup}));
               currentGroup = [];
               currentDate = date;
           }
            var photoUrl = data[i].photoUrl;
            if (typeof(data[i].thumbnailUrl)!="undefined")
                photoUrl = data[i].thumbnailUrl;
            if (data[i].thumbnailSizes != null){
                var closest = null;
                var closestValue = 100000;
                for (var j in data[i].thumbnailSizes){
                    var difference = Math.pow(data[i].thumbnailSizes[j].height - 200,2) + Math.pow(data[i].thumbnailSizes[j].width - 200,2);
                    if (difference < closestValue){
                        closest = j;
                        closestValue = difference;
                    }
                }
                if (closest != null){
                    photoUrl = data[i].thumbnailUrls[closest];
                }
            }
            currentGroup[currentGroup.length] = {id:data[i].id,photoUrl:photoUrl};
        }
        if (currentGroup.length != 0){
            $("#photoTab").append(thumbnailGroupTemplate.render({date:currentDate,photos:currentGroup}));
        }
        for (var i = 0; i < data.length; i++){
            $("#photo-" + data[i].id).click({i:data[i].id},function(event){
                App.makeModal(carouselHTML);
                App.carousel(event.data.i);
            });
        }
        var groups = $(".thumbnailGroup");
        for (var i = 0; i < groups.length; i++){
            $(groups[i]).imagesLoaded(function(event){
                $(this).masonry({
                     itemSelector: '.photoThumbnail',
                     columnWidth:1
                 });
            });
        }

    }

    function connectorToggled(connectorName,objectTypeNames,enabled){
        connectorEnabled[connectorName] = enabled;
        setup(digest,connectorEnabled);
    }

    function connectorDisplayable(connector){
        for (var i = 0; i < connector.facetTypes.length; i++){
            var config = App.getFacetConfig(connector.facetTypes[i]);
            if (config.photos)
                return true;
        }
        return false;
    }

    var photosTab = new Tab("calendar", "photos", "Candide Kemmler", "icon-camera", true);
    photosTab.render = render;
    photosTab.connectorToggled = connectorToggled;
    photosTab.connectorDisplayable = connectorDisplayable;
    return photosTab;

});

