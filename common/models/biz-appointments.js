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
    	// {
    	// 	"appointmentDate":"",
    	// 	"appointmentStartTime":"",
    	// 	"appointmentEndTime":"",
    	// 	"totalAmount":"",
    	// 	"amountPaid":"",
    	// 	"amountDue":"",
    	// 	"paymentStatus":"PENDING",
    	// 	"confirmationStatus":"",
    	//  "metaData":{},
    	// 	"services":[
    	// 		{
    	// 			"serviceId":"",
    	// 			"serviceProviderId":""
    	// 		}
    	// 	]
    	// }

    	appointmentInfo["appointmentStartDateTime"] = funUpdateDateFormat(appointmentInfo["appointmentDate"],appointmentInfo["appointmentStartTime"]);
    	appointmentInfo["appointmentEndDateTime"] = funUpdateDateFormat(appointmentInfo["appointmentDate"],appointmentInfo["appointmentEndTime"]);

    	appointmentInfo["isRescheduled"] = false;
    	appointmentInfo["isCancelled"] = false;
    	appointmentInfo["isCompleted"] = false;
    	appointmentInfo["isDeleted"] = false;
    	appointmentInfo["metaData"] = {};
    	appointmentInfo["createdAt"] = new Date();
    	appointmentInfo["bizSiteId"] = convertObjectIdToString(businessSiteId);


    	Bizservices.app.models.BizSites.findOne({"where":{"bizSiteId":convertObjectIdToString(businessSiteId)}}).then(businessInfo=>{
    		if(isValidObject(businessInfo)){
    			Bizappointments.create(appointmentInfo).then(apptInfo=>{

    				funUpdateServicesForAppointment(appointmentInfo["services"],apptInfo["appointmentId"]);
    				cb(null,{"success":true,"appointmentId": apptInfo["appointmentId"] });

    			}).catch(error=>{
				    return cb(new HttpErrors.InternalServerError('Error while creating appointment.', {
			                expose: false
			        }));	
				});
    		}else{
    			return cb(new HttpErrors.InternalServerError('Invalid Site Id Or Site Info not found.', {
                    expose: false
                }));
    		}
    	}).catch(error=>{
		    return cb(new HttpErrors.InternalServerError('Invalid site id', {
	                expose: false
	        }));	
		});

    }

    function funUpdateServicesForAppointment(apptServices,appointmentId){
    	let insertJson = {};
    	Bizappointments.app.models.AppointmentServiceProviderRelation.destroyAll({"where":{"appointmentId":appointmentId}}).then(res=>{
    		async.each(apptServices,function(item,callbk){

    			insertJson = {
    				"bizSiteId":"",
    				"appointmentId": appointmentId ,
    				"bizServiceId":item["serviceId"],
    				"bizServiceProviderId":item["serviceProviderId"],
    				"moduleServiceId":"",
    				"moduleServiceProviderId":"",
    				"isActive":true
    			};

    			Bizappointments.app.models.BizServices.findOne({"where":{"bizServiceId": convertObjectIdToString(item["serviceId"]) }}).then(serviceInfo=>{
    				insertJson["moduleServiceId"] = serviceInfo["moduleServiceId"];
    				Bizappointments.app.models.BizServiceProviders.findOne({"where":{"bizServiceProviderId": convertObjectIdToString(item["serviceProviderId"]) }}).then(providerInfo=>{
    					insertJson["moduleServiceProviderId"] = serviceInfo["moduleServiceProviderId"];

    					Bizappointments.app.models.AppointmentServiceProviderRelation.create(insertJson).then(response=>{
			    			callbk();
			    		}).catch(error=>{
						    callbk();
						});
				
    				});
    			});

	    	},function(){

	    	});

    	}).catch(error=>{
		    	
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
    }


    Bizappointments.remoteMethod(
        'listAppointment', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
                { arg: 'businessSiteId', type: 'string', required: true, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizappointments.listAppointment = (businessSiteId, cb) => {
    }

    // 1. Get service based Not available time slots - day, week, month
    // 2. Get service provider based Not available time slots - day, week, month


};
