// This JS file is used to modify the look of the site. All the modifications
// to the default template should be made at the function modifyInterface
// which is called insisde mapDisplay. 
goog.provide('owgis.interf');

var colorLink;
var colorLinkOver;
var colorLinkClick;
var colorLinkDisabled;

if(mapConfig['menuDesign']==='sideMenu'){
	colorLink = "#0D3D52"; // When the mouse is not over and is not being clicked
	colorLinkOver = "#467387"; // When the mouse is over
	colorLinkClick = "#72919E";	// When the button is being clicked
	colorLinkDisabled = "darkgray";	// When the button is disabled
}else{
	colorLink = "#CDF1FA"; // When the mouse is not over and is not being clicked
	colorLinkOver = "#91B6FF"; // When the mouse is over
	colorLinkClick = "#1B2DFF";	// When the button is being clicked
	colorLinkDisabled = "gray";	// When the button is disabled
}

/**
 * Defines how are we displaying a 'loading' behaviour at the mouse 
 * @param {bool} loading Indicates if the loading shoudl be on or off
 * @returns {void}
 */
owgis.interf.loadingatmouse= function(loading){
	if(mobile){
		if(loading){
			$('#l-animation').show("fade");
		}else{
			$('#l-animation').hide("fade");
		}
	}else{
		if(loading){
			$("#map").removeClass("defaultCursor");
			$("#map").addClass("loadingCursor");
		}else{
			$("#map").removeClass("loadingCursor");
			$("#map").addClass("defaultCursor");
		}
	}
}

/**
 * This function shows a 'loading' that involves all the screen.  
 * @param {type} loading
 * @returns {undefined}
 */
owgis.interf.loadingallscreen = function(loading){
	if(mobile){
		if(loading){
			$(".loader").fadeIn("slow");
		}else{
			$(".loader").fadeOut("slow");
		}
	}else{
		if(loading){
			$("#map").removeClass("defaultCursor");
			$("#map").addClass("loadingCursor");
		}else{
			$("#map").removeClass("loadingCursor");
			$("#map").addClass("defaultCursor");
		}
	}
}
/**
 * This function is used to show a 'loading' behaviour at the middle 
 * of the map. If it receives a % then it is also displayed.  
 * @param {bool} loading Indicates if the 'loading' should be displayed or not
 * @param {int} percentage Percentaje of loading displayed. 
 * @returns void
 */
owgis.interf.loadingatmap = function(loading,percentage,extraText){
	if(loading){
		if(percentage !== undefined){
			if(_.isEmpty(extraText)){
				$("#loadperc").html(percentage +"<small> %</small>");
			}else{
				$("#loadperc").html(extraText+" "+ percentage +"<small> %</small>");
			}
		}else{
			$("#loadperc").text("");
			$("#loadperc").addClass("loading")
		}
		$('#l-animation').show("fade");
	}else{
		$('#l-animation').hide("fade");
	}
}

/**
 * This is the main function that should encompass all the specific code for the site,
 * for example all the modifications to the interface depending on some layers 
 * @returns {undefined}
 */
function modifyInterface(){
    if(layerDetails.isParticle != "false" && !mobile){
        //add to "#v-pills-tab"
        var estaciones= ['AJM', 'MGH', 'CCA', 'SFE', 'UAX', 'CUA', 'NEZ', 'CAM','LPR','SJA','IZT','SAG','TAH','ATI','FAC','UIZ','MER','PED','TLA','XAL','CHO','BJU'];
        
        for( var i=0; i<estaciones.length; i++ ){
            //create new li element like:
            // <li role="presentation"><a class="nav-link" id="v-pills-CUA-tab" href="#" role="tab" aria-controls="v-pills-CUA" aria-selected="false" onclick="changeEstTabContent('CUA')">CUA</a></li>
            var newNumberListItem = document.createElement("li");
            newNumberListItem.setAttribute("role", "presentation");
            var newLink = document.createElement("a");
            newLink.className = "nav-link";
            newLink.href = "#";
            newLink.setAttribute("id", "v-pills-"+estaciones[i]+"-tab");
            newLink.setAttribute("role", "tab");
            newLink.setAttribute("aria-controls", "v-pills-"+estaciones[i] );
            newLink.setAttribute("onclick", "changeEstTabContent('"+estaciones[i]+"')" );
            if( i ==0 ){
                // class="active" // aria-selected="true"
                newNumberListItem.className = "active";
                newLink.setAttribute("aria-selected", "true");
            } else {
                newLink.setAttribute("aria-selected", "false");
            }
            //create new text node
            var numberListValue = document.createTextNode(estaciones[i]);
            //add text node to li element
            newLink.appendChild(numberListValue);
            newNumberListItem.appendChild(newLink);
            //add new list element built in previous steps to unordered list called numberList
            document.getElementById("v-pills-tab").appendChild(newNumberListItem);
        }
        
        document.getElementById('estaciones_charts').style.display = "block";
        document.getElementById('v-pills-tab').style.height = document.getElementById('estaciones_charts').offsetHeight-30+'px' ;
        $('#estaciones_charts').draggable();
        
        $('#estaciones_charts').resizable({
                                    minHeight: 500,
                                    minWidth: 600,
                                    resize: function( event, ui ) {
                                        if (typeof $("#forecastvsreportHighcharts").highcharts() != 'undefined'){
                                            $("#forecastvsreportHighcharts").highcharts().setSize(document.getElementById('v-pills-tabContent').offsetWidth-30, document.getElementById('estaciones_charts').offsetHeight-30, doAnimation = true);
                                        }
                                        document.getElementById('v-pills-tab').style.height = document.getElementById('estaciones_charts').offsetHeight-30+'px';
                                    }
                                });
                                
        createChartFVSR(estaciones[0]);                  
    }
}

function changeEstTabContent(IDEST){
    //console.log(IDEST);
    allEsts = document.getElementById('v-pills-tab').getElementsByTagName("li");
    var arrayLength = allEsts.length;
    for (var i = 0; i < arrayLength; i++) {
        allEsts[i].className = "";
    }
    document.getElementById('v-pills-'+IDEST+'-tab').parentElement.className = "active"
    createChartFVSR(IDEST);
}

Date.prototype.addDays = function(days) {
       var dat = new Date(this.valueOf())
       dat.setDate(dat.getDate() + days);
       return dat;
}

Date.prototype.addHours= function(h){
    var copiedDate = new Date(this.getTime());
    copiedDate.setHours(copiedDate.getHours()+h);
    return copiedDate;
}

function getDates(startDate, stopDate) {
      var dateArray = new Array();
      var currentDate = startDate;
      while (currentDate <= stopDate) {
        dateArray.push(currentDate)
        currentDate = currentDate.addHours(1);
      }
      return dateArray;
}

function createChartFVSR(id_est){
    var ajaxCan;
    var date = new Date();
    var n = date.toISOString().slice(0,10);

    $.ajax({
                url: "http://10.20.12.147:9999/WebServiceContingencia/API/contingencia/"+layerDetails.isParticle+"/"+id_est+"/"+n+"/00:00",
                async: true,
                crossDomain : true,
                type: "GET",
                dataType: 'json',
                success: function(data) {
                    
                          ajaxCan = true;
                          
                          report = [];
                          forecast = [];
                          alldates = [];
                          
                          ellength = data.report.length;
                          forecastlen = data.forecast.length;
                          
                        day1=new Date();
                        day1.setHours(0,0,0,0);
                        day2 = (day1).addDays(-1);
                        eday = (day1).addDays(1);
                        var dateArray = getDates(day2,eday);
                        
                        for(var i=0;i<ellength;i++){
                            fechaRd = new Date(data.report[i][0]);
                            for(var j=0;j<dateArray.length;j++){
                                if(fechaRd.getTime()  ===  dateArray[j].getTime()){
                                    report[j] = data.report[i][1];
                                } else if(report[j] != null) {
                                    //
                                } else {
                                    report[j] = null;
                                }
                            }
                        }
                        
                        for(var i=0;i<forecastlen;i++){
                            fechaRdi = new Date(data.forecast[i][0]);
                            for(var j=0;j<dateArray.length;j++){
                                
                                    if(fechaRdi.getTime() === dateArray[j].getTime() ){
                                        forecast[j] = data.forecast[i][1];
                                    } else if(forecast[j] != null) {
                                        //
                                    } else {
                                        forecast[j] = null;
                                    }
                            }
                        }
                          
                        Highcharts.chart('forecastvsreportHighcharts', {
                            chart: {
                                width: document.getElementById('v-pills-tabContent').offsetWidth-30,
                                height: document.getElementById('estaciones_charts').offsetHeight-60
                            },
                            title: {
                              text: 'Pronóstico VS Informe'
                            },
                            subtitle: {
                                text: 'Contaminante: '+layerDetails.isParticle+', datos de '+id_est
                            },
                            xAxis: {
                                categories: dateArray,
                                //crosshair: true,
                                labels: {
                                    formatter: function () {
                                        return this.value.getDate()+'/'+this.value.getMonth()+'/'+this.value.getFullYear()+' '+this.value.getHours()+":00";
                                    }
                                },
                                    title: {
                                        text: 'Fecha',
                                        
                                    }
                                
                            },
                            yAxis: [
                                { // Primary yAxis
                                    labels: {
                                        //format: '{value}°C',
                                        
                                    },
                                    title: {
                                        text: 'Concentración del contaminante',
                                        
                                    }

                                }
                            ],
                            tooltip: {
                                    shared: true
                                    //pointFormat: "{point.y:.2f} "
                            },
                            series: [{
                                    name: 'Informe',
                                    type: 'spline',
                                    data: report,
                                    dashStyle: 'shortdot'

                                }, {
                                    name: 'Pronóstico',
                                    type: 'spline',
                                    data: forecast,
                                }]
                            }
                        );

                        },
                        error: function(ex) {
                          console.log(ex);
                          console.log('NOT!');
                          ajaxCan = false; 
                        }
                      });
}