'use strict';
const HttpErrors = require('http-errors');
const {
    findReplace,
    unique,
    isValidObject,
    isValid,
    flattenArray,
    clean,
    isArray,
    isObject,
    print,
    isNull,
    convertObjectIdToString
} = require('../../utility/helper');
let async = require('async');

module.exports = function(Bizappointments) {

	Bizappointments.remoteMethod(
        'createAppointment', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
            	{ arg: 'appointmentInfo', type: 'object', required: true, http: { source: 'body'} },
                { arg: 'businessSiteId', type: 'string', required: true, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    function funUpdateDateFormat(_date,_time){
    	var _date_ = _date;
        if (String(_date).indexOf('T') > -1) {
            var _date_rr = String(_date).split("T");
            _date_ = _date_rr[0];
        }

        var appointmentDateTime = new Date(_date_);
        var _time = _time; //05:30 PM
        _time = String(_time.trim());
        _time = _time.replace("%20", " ");
        var splt_time = _time.split(" ");
        var splt_timestr = splt_time[0].split(":");
        if (splt_time[1] == "PM") {
            if (splt_timestr[0] != "12" && splt_timestr[0] != 12) {
                splt_timestr[0] = parseInt(splt_timestr[0]) + 12;
            }
        }

        appointmentDateTime.setHours(splt_timestr[0], splt_timestr[1], "00");

        return appointmentDateTime;

    }

    Bizappointments.createAppointment = (appointmentInfo,businessSiteId, cb) => {

        if (!isNull(appointmentInfo["meta"])) {
            appointmentInfo = appointmentInfo["meta"];
        }
    	

    	appointmentInfo["appointmentStartDateTime"] = funUpdateDateFormat(appointmentInfo["appointmentDate"],appointmentInfo["appointmentStartTime"]);
    	appointmentInfo["appointmentEndDateTime"] = funUpdateDateFormat(appointmentInfo["appointmentDate"],appointmentInfo["appointmentEndTime"]);

    	appointmentInfo["isRescheduled"] = false;
    	appointmentInfo["isCancelled"] = false;
    	appointmentInfo["isConfirmed"] = false;
    	appointmentInfo["isCompleted"] = false;
    	appointmentInfo["isDeleted"] = false;
    	appointmentInfo["metaData"] = appointmentInfo["metaData"];
    	appointmentInfo["createdAt"] = new Date();
    	appointmentInfo["bizSiteId"] = convertObjectIdToString(businessSiteId);

    	let apptServices =  appointmentInfo["services"];
    	delete appointmentInfo["services"];

    	Bizappointments.app.models.BizSites.findOne({"where":{"bizSiteId":convertObjectIdToString(businessSiteId)}}).then(businessInfo=>{
    		//console.log(businessInfo)
            if(isValidObject(businessInfo)){

    			appointmentInfo["moduleSiteId"] = businessInfo["moduleSiteId"];

    			Bizappointments.app.models.BizClients.findOne({"where":{"bizClientId":convertObjectIdToString(appointmentInfo["bizClientId"])}}).then(clientInfo=>{
    				if(isValidObject(clientInfo)){

	    				appointmentInfo["moduleClientId"] = clientInfo["moduleClientId"];
	    				appointmentInfo["bizClientId"] = convertObjectIdToString(appointmentInfo["bizClientId"]);

	    				Bizappointments.create(appointmentInfo).then(apptInfo=>{

		    				funUpdateServicesForAppointment(apptServices,apptInfo["moduleAppointmentId"],businessSiteId);
		    				cb(null,{"success":true,"appointmentId": apptInfo["moduleAppointmentId"] });

		    			}).catch(error=>{
						    return cb(new HttpErrors.InternalServerError('Error while creating appointment.', {
					                expose: false
					        }));	
						});
		    		}else{
		    			return cb(new HttpErrors.InternalServerError('Invalid Client Id', {
				                expose: false
				    	}));
		    		}

    			}).catch(err=>{
    				return cb(new HttpErrors.InternalServerError('Error while fetching client.', {
				                expose: false
				    }));
    			})

    			
    		}else{
    			return cb(new HttpErrors.InternalServerError('Invalid Site Id Or Site Info not found.', {
                    expose: false
                }));
    		}
    	})
        .catch(error=>{
		    return cb(new HttpErrors.InternalServerError('Invalid site id', {
	                expose: false
	        }));	
		});

    }

    function funUpdateServicesForAppointment(apptServices,appointmentId,bizSiteId){
    	let insertJson = {};
        //console.log(apptServices);

    	Bizappointments.app.models.AppointmentServiceProviderRelation.destroyAll({"appointmentId":appointmentId}).then(res=>{
            //console.log(res);
    		async.each(apptServices,function(item,callbk){

    			insertJson = {
                    "bizSiteId": bizSiteId,
                    "moduleSiteId":"",
    				"appointmentId": appointmentId ,
    				"bizServiceId":convertObjectIdToString(item["serviceId"]),
    				"bizServiceProviderId":convertObjectIdToString(item["serviceProviderId"]),
    				"moduleServiceId":"",
    				"moduleServiceProviderId":"",
    				"isActive":true
    			};

                Bizappointments.app.models.BizSites.findOne({"where":{"bizSiteId": convertObjectIdToString(bizSiteId) }}).then(bizInfo=>{
                        insertJson["moduleSiteId"] = bizInfo["moduleSiteId"];
        			Bizappointments.app.models.BizServices.findOne({"where":{"bizServiceId": convertObjectIdToString(item["serviceId"]) }}).then(serviceInfo=>{
        				insertJson["moduleServiceId"] = serviceInfo["moduleServiceId"];
        				
                        Bizappointments.app.models.BizServiceProviders.findOne({"where":{"bizServiceProviderId": convertObjectIdToString(item["serviceProviderId"]) }}).then(providerInfo=>{
        					insertJson["moduleServiceProviderId"] = providerInfo["moduleServiceProviderId"];
                            //console.log("2222");
        					Bizappointments.app.models.AppointmentServiceProviderRelation.create(insertJson).then(response=>{
    			    			//console.log("33333");
                                callbk();
    			    		}).catch(error=>{
    						    callbk();
    						});
    				
        				}).catch(error=>{
        					callbk();
        				});
        			}).catch(error=>{
        				callbk();
        			});
                }).catch(error=>{
                        callbk();
                 });

	    	},function(){

	    	});

    	})
        .catch(error=>{
		    	
		});

    	
    }


    Bizappointments.remoteMethod(
        'editAppointment', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
            	{ arg: 'appointmentInfo', type: 'object', required: true, http: { source: 'body'} },
                { arg: 'appointmentId', type: 'string', required: true, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizappointments.editAppointment = (appointmentInfo,appointmentId, cb) => {
    	Bizappointments.findById(appointmentId).then(appoinmentResponse=>{
    		if(isValidObject(appoinmentResponse)){

    			appointmentInfo["appointmentStartDateTime"] = funUpdateDateFormat(appointmentInfo["appointmentDate"],appointmentInfo["appointmentStartTime"]);
		    	appointmentInfo["appointmentEndDateTime"] = funUpdateDateFormat(appointmentInfo["appointmentDate"],appointmentInfo["appointmentEndTime"]);

		    	appointmentInfo["isRescheduled"] = false;
		    	appointmentInfo["isCancelled"] = false;
		    	appointmentInfo["isConfirmed"] = false;
		    	appointmentInfo["isCompleted"] = false;
		    	appointmentInfo["isDeleted"] = false;

		    	appointmentInfo["bizSiteId"] = appoinmentResponse["bizSiteId"];
		    	appointmentInfo["moduleSiteId"] = appoinmentResponse["moduleSiteId"];
		    	appointmentInfo["moduleClientId"] = appoinmentResponse["moduleClientId"];

		    	let apptServices =  appointmentInfo["services"];
    			delete appointmentInfo["services"];

    			appoinmentResponse.updateAttributes(appointmentInfo).then(updateInfo=>{
    				funUpdateServicesForAppointment(apptServices,appoinmentResponse["appointmentId"],appointmentInfo["bizSiteId"]);
    				cb(null,{"success":true,"appointmentId": appoinmentResponse["appointmentId"] });
    			}).catch(error=>{
    				return cb(new HttpErrors.InternalServerError('Error while updating appointment.', {
		                expose: false
		        	}));
    			});

    		}else{
    			return cb(new HttpErrors.InternalServerError('Invalid Appointment id', {
	                expose: false
	        	}));
    		}
    	}).catch(error=>{
    		return cb(new HttpErrors.InternalServerError('Internal server error.', {
	                expose: false
	        	}));
    	});
    }


    Bizappointments.remoteMethod(
        'rescheduleAppointment', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
            	{ arg: 'appointmentInfo', type: 'object', required: true, http: { source: 'body'} },
                { arg: 'appointmentId', type: 'string', required: true, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizappointments.rescheduleAppointment = (appointmentInfo,appointmentId, cb) => {
    	Bizappointments.findById(appointmentId).then(appoinmentResponse=>{
    		if(isValidObject(appoinmentResponse)){

    			appointmentInfo["appointmentStartDateTime"] = funUpdateDateFormat(appointmentInfo["appointmentDate"],appointmentInfo["appointmentStartTime"]);
		    	appointmentInfo["appointmentEndDateTime"] = funUpdateDateFormat(appointmentInfo["appointmentDate"],appointmentInfo["appointmentEndTime"]);

		    	appointmentInfo["isRescheduled"] = true;
		    	appointmentInfo["isCancelled"] = false;
		    	appointmentInfo["isConfirmed"] = false;
		    	appointmentInfo["isCompleted"] = false;
		    	appointmentInfo["isDeleted"] = false;

		    	appointmentInfo["bizSiteId"] = appoinmentResponse["bizSiteId"];
		    	appointmentInfo["moduleSiteId"] = appoinmentResponse["moduleSiteId"];
		    	appointmentInfo["moduleClientId"] = appoinmentResponse["moduleClientId"];

		    	let apptServices =  appointmentInfo["services"];
    			delete appointmentInfo["services"];

    			appoinmentResponse.updateAttributes(appointmentInfo).then(updateInfo=>{
    				cb(null,{"success":true,"appointmentId": appoinmentResponse["appointmentId"] });
    			}).catch(error=>{
    				return cb(new HttpErrors.InternalServerError('Error while updating appointment.', {
		                expose: false
		        	}));
    			});

    		}else{
    			return cb(new HttpErrors.InternalServerError('Invalid Appointment id', {
	                expose: false
	        	}));
    		}
    	}).catch(error=>{
    		return cb(new HttpErrors.InternalServerError('Internal server error.', {
	                expose: false
	        	}));
    	});
    }


    Bizappointments.remoteMethod(
        'cancelAppointment', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
                { arg: 'appointmentId', type: 'string', required: true, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizappointments.cancelAppointment = (appointmentId, cb) => {
    	Bizappointments.findById(appointmentId).then(appoinmentResponse=>{
    		if(isValidObject(appoinmentResponse)){

		    	appointmentInfo["isCancelled"] = true;

    			appoinmentResponse.updateAttributes(appointmentInfo).then(updateInfo=>{
    				cb(null,{"success":true,"appointmentId": appoinmentResponse["appointmentId"] });
    			}).catch(error=>{
    				return cb(new HttpErrors.InternalServerError('Error while updating appointment.', {
		                expose: false
		        	}));
    			});

    		}else{
    			return cb(new HttpErrors.InternalServerError('Invalid Appointment id', {
	                expose: false
	        	}));
    		}
    	}).catch(error=>{
    		return cb(new HttpErrors.InternalServerError('Internal server error.', {
	                expose: false
	        	}));
    	});
    }


    Bizappointments.remoteMethod(
        'deleteAppointment', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
                { arg: 'appointmentId', type: 'string', required: true, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizappointments.deleteAppointment = (appointmentId, cb) => {
    	Bizappointments.findById(appointmentId).then(appoinmentResponse=>{
    		if(isValidObject(appoinmentResponse)){

		    	appointmentInfo["isDeleted"] = false;

    			appoinmentResponse.updateAttributes(appointmentInfo).then(updateInfo=>{
    				cb(null,{"success":true,"appointmentId": appoinmentResponse["appointmentId"] });
    			}).catch(error=>{
    				return cb(new HttpErrors.InternalServerError('Error while updating appointment.', {
		                expose: false
		        	}));
    			});

    		}else{
    			return cb(new HttpErrors.InternalServerError('Invalid Appointment id', {
	                expose: false
	        	}));
    		}
    	}).catch(error=>{
    		return cb(new HttpErrors.InternalServerError('Internal server error.', {
	                expose: false
	        	}));
    	});
    }


    Bizappointments.remoteMethod(
        'confirmAppointment', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
                { arg: 'appointmentId', type: 'string', required: true, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizappointments.confirmAppointment = (appointmentId, cb) => {
    	Bizappointments.findById(appointmentId).then(appoinmentResponse=>{
    		if(isValidObject(appoinmentResponse)){

		    	appointmentInfo["isConfirmed"] = true;

    			appoinmentResponse.updateAttributes(appointmentInfo).then(updateInfo=>{
    				cb(null,{"success":true,"appointmentId": appoinmentResponse["appointmentId"] });
    			}).catch(error=>{
    				return cb(new HttpErrors.InternalServerError('Error while updating appointment.', {
		                expose: false
		        	}));
    			});

    		}else{
    			return cb(new HttpErrors.InternalServerError('Invalid Appointment id', {
	                expose: false
	        	}));
    		}
    	}).catch(error=>{
    		return cb(new HttpErrors.InternalServerError('Internal server error.', {
	                expose: false
	        	}));
    	});
    }


    Bizappointments.remoteMethod(
        'markCompleteAppointment', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
                { arg: 'appointmentId', type: 'string', required: true, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizappointments.markCompleteAppointment = (appointmentId, cb) => {
        Bizappointments.findById(appointmentId).then(appointmentInfo=>{
            if(isValidObject(appointmentInfo)){

                appointmentInfo["isCompleted"] = true;

                appoinmentResponse.updateAttributes(appointmentInfo).then(updateInfo=>{
                    cb(null,{"success":true,"appointmentId": appoinmentResponse["appointmentId"] });
                }).catch(error=>{
                    return cb(new HttpErrors.InternalServerError('Error while updating appointment.', {
                        expose: false
                    }));
                });

            }else{
                return cb(new HttpErrors.InternalServerError('Invalid Appointment id', {
                    expose: false
                }));
            }
        }).catch(error=>{
            return cb(new HttpErrors.InternalServerError('Internal server error.', {
                    expose: false
                }));
        });
    }

    Bizappointments.remoteMethod(
        'listAppointmentsByService', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
                { arg: 'businessSiteId', type: 'string', required: false, http: { source: 'query' } },
                { arg: 'businessServiceId', type: 'string', required: true, http: { source: 'query' } },
                { arg: 'pageNo', type: 'number', required: false, http: { source: 'query' } },
                { arg: 'timeframe', type: 'number', required: false, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizappointments.listAppointmentsByService = (businessSiteId,businessServiceId,pageNo,timeframe, cb) => {

        let limit = 10;
        let whereClause = {"isCancelled":false,"isDeleted":false };
        if(!isNull(businessSiteId)){
            whereClause["bizSiteId"] = convertObjectIdToString(businessSiteId);
        }

        let insideWhereClause = {"isActive":true};

        if(!isNull(businessServiceId)){
            insideWhereClause["bizServiceId"] = convertObjectIdToString(businessServiceId);
        }

        if (timeframe != "" && timeframe != null) {
            switch(timeframe){
                case "COMPLETED":
                    whereClause["isCompleted"] = true;
                    whereClause["isCancelled"] = false; 
                    whereClause["isDeleted"] = false;
                break;
                case "TODAY":
                    whereClause["isCompleted"] = false;
                    let _cDate = new Date();
                    let _sDate = new Date((_cDate.getMonth()+1)+"-"+_cDate.getDate()+"-"+_cDate.getFullYear()+" 00:00:00");
                    let _eDate = new Date((_cDate.getMonth()+1)+"-"+_cDate.getDate()+"-"+_cDate.getFullYear()+" 23:59:59");
                    whereClause["isCancelled"] = false; 
                    whereClause["isDeleted"] = false;
                    whereClause["appointmentDate"] = {"gte":_sDate,"lte":_eDate};
                break;
                case "UPCOMING":
                    whereClause["isCompleted"] = false;
                    let _cuDate = new Date();
                    let _enDate = new Date((_cuDate.getMonth()+1)+"-"+_cuDate.getDate()+"-"+_cuDate.getFullYear()+" 23:59:59");
                    whereClause["isCancelled"] = false; 
                    whereClause["isDeleted"] = false;
                    whereClause["appointmentDate"] = {"gt":_enDate};
                break;
            }
        }


        let filterObject = {"where": whereClause ,
                            "include":[
                                    {relation:'Biz'}, 
                                    {relation:'Client'},
                                    {relation:'ApptServices',scope:{
                                        where: insideWhereClause,
                                        include:[{relation:'Service'},{relation:'ServiceProvider'}]
                                    }}
                                    ],
                            "order":"appointmentStartTime ASC"
                        };
        //console.log(filterObject);

        filterObject.skip = parseInt(pageNo) * parseInt(limit);
        filterObject.limit = limit;

        Bizappointments.find(filterObject).then(appointments=>{
            cb(null,appointments);
        }).catch(err=>{
            return cb(new HttpErrors.InternalServerError('Internal server error.', {
                    expose: false
            }));
        });
    }


    Bizappointments.remoteMethod(
        'listAppointments', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
                { arg: 'businessSiteId', type: 'string', required: false, http: { source: 'query' } },
                { arg: 'businessClientId', type: 'string', required: false, http: { source: 'query' } },
                { arg: 'pageNo', type: 'number', required: false, http: { source: 'query' } },
                { arg: 'timeframe', type: 'number', required: false, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizappointments.listAppointments = (businessSiteId,businessClientId,pageNo,timeframe, cb) => {

    	let limit = 10;
    	let whereClause = {"isCancelled":false,"isDeleted":false };
    	if(!isNull(businessClientId)){
    		whereClause["bizClientId"] = convertObjectIdToString(businessClientId);
    	}

        if(!isNull(businessSiteId)){
            whereClause["bizSiteId"] = convertObjectIdToString(businessSiteId);
        }

        if (timeframe != "" && timeframe != null) {
            switch(timeframe){
                case "COMPLETED":
                    whereClause["isCompleted"] = true;
                    whereClause["isCancelled"] = false; 
                    whereClause["isDeleted"] = false;
                break;
                case "TODAY":
                    whereClause["isCompleted"] = false;
                    let _cDate = new Date();
                    let _sDate = new Date((_cDate.getMonth()+1)+"-"+_cDate.getDate()+"-"+_cDate.getFullYear()+" 00:00:00");
                    let _eDate = new Date((_cDate.getMonth()+1)+"-"+_cDate.getDate()+"-"+_cDate.getFullYear()+" 23:59:59");
                    whereClause["isCancelled"] = false; 
                    whereClause["isDeleted"] = false;
                    whereClause["appointmentDate"] = {"gte":_sDate,"lte":_eDate};
                break;
                case "UPCOMING":
                    whereClause["isCompleted"] = false;
                    let _cuDate = new Date();
                    let _enDate = new Date((_cuDate.getMonth()+1)+"-"+_cuDate.getDate()+"-"+_cuDate.getFullYear()+" 23:59:59");
                    whereClause["isCancelled"] = false; 
                    whereClause["isDeleted"] = false;
                    whereClause["appointmentDate"] = {"gt":_enDate};
                break;
            }
        }


    	let filterObject = {"where": whereClause ,
    						"include":[
    								{relation:'Biz'}, 
    								{relation:'Client'},
    								{relation:'ApptServices',scope:{
    									include:[{relation:'Service'},{relation:'ServiceProvider'}]
    								}}
    								],
    						"order":"appointmentStartTime ASC"
    					};
    	//console.log(filterObject);

    	filterObject.skip = parseInt(pageNo) * parseInt(limit);
		filterObject.limit = limit;

    	Bizappointments.find(filterObject).then(appointments=>{
    		cb(null,appointments);
    	}).catch(err=>{
    		return cb(new HttpErrors.InternalServerError('Internal server error.', {
	                expose: false
	        }));
    	});
    }


    Bizappointments.remoteMethod(
        'getAppointmentsCalender', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
                { arg: 'businessSiteId', type: 'string', required: true, http: { source: 'query' } },
                { arg: 'filterCriteria', type: 'object', required: true, http: { source: 'body' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizappointments.getAppointmentsCalender = (businessSiteId,appointmentStatus,filterCriteria, cb) => {
    	// {
    	// 	"filterCriteria":{
    	//      "appointmentStatus":"TODAY/PAST/COMPLETED/UPCOMING/CONFIRMED/UNCONFIRMED",	
    	// 		"filterBy":"DAY / WEEK / MONTH",
    	// 		"startDate":"MM-DD-YYYY",
    	// 		"endDate":"MM-DD-YYYY"
    	// 	}
    	// }

    	filterCriteria = filterCriteria["filterCriteria"];
    	switch(filterCriteria["filterBy"].toUpperCase()){
    		case "DAY":
    		break;
    		case "WEEK":
    		break;
    		case "MONTH":
    		break;
    	}

    	//TODO :  IMPMLEMENTATION
    	cb(null,{"success":true});

    }


    Bizappointments.remoteMethod(
        'getServiceProviderCalender', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
                { arg: 'businessSiteId', type: 'string', required: true, http: { source: 'query' } },
                { arg: 'businessServiceProviderId', type: 'string', required: true, http: { source: 'query' } },
                { arg: 'filterCriteria', type: 'object', required: true, http: { source: 'body' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizappointments.getServiceProviderCalender = (businessSiteId,businessServiceProviderId,filterCriteria, cb) => {
    	//TODO :  IMPMLEMENTATION
        Bizappointments.app.models.BizSites.findOne({"where":{"bizSiteId":convertObjectIdToString(businessSiteId)}}).then(businessInfo=>{
            if(isValidObject(businessInfo)){

                Bizappointments.app.models.BizServiceProviders.findOne({"where":{"bizServiceProviderId": convertObjectIdToString(businessServiceProviderId) }}).then(providerInfo=>{

                    if(isValidObject(providerInfo)){
                        let includeCond=[{relation:'Appointment',scope:{where:{"isCancelled":false,"isDeleted":false},fields:["appointmentDate","appointmentStartTime","appointmentEndTime"]}}];
                        //console.log(convertObjectIdToString(businessServiceProviderId));
                        //includeCond = [{relation:'Appointment'}];
                        Bizappointments.app.models.AppointmentServiceProviderRelation.find({"where":{"bizServiceProviderId": convertObjectIdToString(businessServiceProviderId) },"include":includeCond }).then(providrTimeSlots=>{
                            //console.log(providrTimeSlots);
                            cb(null,providrTimeSlots);
                        });
                    }else{
                        return cb(new HttpErrors.InternalServerError('Invalid Service Provider Id.', {
                            expose: false
                        }));
                    }
                    
                }).catch(err=>{
                    return cb(new HttpErrors.InternalServerError('Error while fetching service provider Info.', {
                            expose: false
                    }));
                });
            }else{
                return cb(new HttpErrors.InternalServerError('Invalid site Id.', {
                    expose: false
                }));
            }
            
        }).catch(err=>{
            return cb(new HttpErrors.InternalServerError('Error while fetching site Info.', {
                    expose: false
            }));
        });	
    }


    Bizappointments.remoteMethod(
        'getAppointmentDetails', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
                { arg: 'appointmentId', type: 'string', required: true, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizappointments.getAppointmentDetails = (appointmentId, cb) => {
    	let filterObject = {"where": {"moduleAppointmentId":appointmentId} ,
    						"include":[
    								{relation:'Biz'}, 
    								{relation:'Client'},
    								{relation:'ApptServices',scope:{
    									include:[{relation:'Service'},{relation:'ServiceProvider'}]
    								}}
    								],
    						"order":"appointmentStartTime ASC"
    					};

    	Bizappointments.findOne(filterObject).then(appointments=>{
    		cb(null,appointments);
    	}).catch(err=>{
    		return cb(new HttpErrors.InternalServerError('Internal server error.', {
	                expose: false
	        }));
    	});
    }



    // 1. Get service based Not available time slots - day, week, month
    // 2. Get service provider based Not available time slots - day, week, month


};
