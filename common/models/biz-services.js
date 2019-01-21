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

module.exports = function(Bizservices) {

	Bizservices.remoteMethod(
        'addEditService', {
            http: {
                verb: 'post'
            },
            description: ["It will create service for the site."],
            accepts: [{
                arg: 'serviceInfo',
                type: 'object',
                required: true,
                http: {
                    source: 'body'
                },
                {
                arg: 'businessSiteId',
                type: 'string',
                required: true,
                http: {
                    source: 'query'
                }
            }],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Bizservices.addEditService = (serviceInfo,businessSiteId, cb) => {
    	// {
    	// 	"bizClientId":"",
    	// 	"firstName":"",
    	// 	"lastName":"",
    	// 	"email":"",
    	// 	"mobileNumber":"",
    	// 	"metaData":{}
    	// }

    	let clientData = serviceInfo;

    	Bizservices.app.models.BizSites.findOne({"where":{"bizSiteId":convertObjectIdToString(businessSiteId)}}).then(businessInfo=>{
    		if(isValidObject(businessInfo)){
    			Bizservices.findOne(
		    		{ where: { "bizServiceId": convertObjectIdToString(bizData["bizServiceId"]) }}
		    	).then(bizUserInfo => {
		    		if (isValidObject(bizUserInfo)) {
		    			//Already exists
		    			clientData["bizServiceId"] = bizUserInfo["bizServiceId"];
		    			clientData["isActive"] = bizUserInfo["isActive"];

		    			bizUserInfo.updateAttributes(clientData,function(err,respponse){
		                    if(err){
		                        return cb(new HttpErrors.InternalServerError('Internal Server Error '+JSON.stringify(err), {
		                            expose: false
		                        }));
		                    }else{
		                    	funCreateServiceSiteRelation(bizUserInfo["bizServiceId"],bizServiceId["moduleServiceId"],businessInfo["bizSiteId"],businessInfo["moduleSiteId"]);
		                        cb(null,respponse);
		                    }
		                });
		    		}else{
		    			//create new
		    			clientData["bizServiceId"] = convertObjectIdToString(serviceInfo["bizServiceId"]);
		    			clientData["isActive"] = true;
		    			clientData["createdAt"] = new Date();

		    			Bizservices.create(clientData).then(bizInfo=>{
		                    funCreateServiceSiteRelation(bizInfo["bizServiceId"],bizInfo["moduleServiceId"],businessInfo["bizSiteId"],businessInfo["moduleSiteId"]);
		    				return cb(null,bizInfo);
		    			})catch(err=>{
		    				return cb(new HttpErrors.InternalServerError('Error while creating new services.', {
			                    expose: false
			                })); 
		    			});
		    		}
		        }).catch(error => {
		            let _msg = isNull(error["message"]) ? 'Internal Server Error' : error["message"];
		            const err = new HttpErrors.InternalServerError(_msg, {
		                expose: false
		            });
		            return cb(err);
		        });
    		}else{
    			return cb(new HttpErrors.InternalServerError('Invalid Site Id', {
                    expose: false
                }));
    		}
    	}).catch(error=>{
		    return cb(new HttpErrors.InternalServerError('Invalid site id', {
	                expose: false
	            }));	
		});
    }

    function funCreateServiceSiteRelation(sysServiceId,moduleServiceId,sysSiteId,moduleSiteId){
    	Bizservices.app.models.BizServiceSiteRelation.findOne({"where":{"moduleServiceId":moduleServiceId,"moduleSiteId":moduleSiteId}}).then(response=>{
    		if(isValidObject(response)){
    			response.updateAttributes({"isActive":true}).then(updatedInfo=>{

    			}).catch(error=>{
		    		
		    	});

    		}else{
    			let insertJson = {
    				"bizServiceId":sysServiceId,
    				"moduleServiceId":moduleServiceId,
    				"bizSiteId":sysSiteId,
    				"moduleSiteId": moduleSiteId,
    				"createdAt": new Date(),
    				"isActive": true
    			};

    			Bizservices.app.models.BizServiceSiteRelation.create(insertJson).then(response=>{

    			}).catch(error=>{
		    		
		    	});

    		}
    	}).catch(error=>{
    		
    	});
    }


    Bizservices.remoteMethod(
        'listServices', {
            http: {  verb: 'post'  },
            description: ["It will list active services for the site."],
            accepts: [
                { arg: 'businessSiteId', type: 'string', required: true, http: { source: 'query' } },
                { arg: 'pageNo', type: 'string', required: false, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizservices.listServices = (businessSiteId,pageNo, cb) => {

    	if(isNull(pageNo)){pageNo=0;}
    	let limit = 10;

    	let filterObject = {"where":{"bizSiteId":convertObjectIdToString(businessSiteId),"isActive":true},"include":[{relation:'Service'}]};

		filterObject.skip = parseInt(pageNo) * parseInt(limit);
		filterObject.limit = limit;

    	Bizservices.app.models.BizServiceSiteRelation.find(filterObject).then(bizServices=>{
    		cb(null,bizServices);
    	}).catch(error=>{
    		let _msg = isNull(error["message"]) ? 'Internal Server Error' : error["message"];
            const err = new HttpErrors.InternalServerError(_msg, {
                expose: false
            });
            return cb(err);
    	});
    }

    Bizservices.remoteMethod(
        'removeServicesFromSite', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
                { arg: 'businessServiceIds', type: 'array', required: true, http: { source: 'query' } }
                { arg: 'businessSiteId', type: 'string', required: true, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizservices.removeServicesFromSite = (businessServiceIds,businessSiteId, cb) => {
    	let servicesArr = String(businessServiceIds).split(",");
    	let erroredRes = false; let errorMessage = "";

    	async.each(servicesArr,function(businessServiceId,callbk){
    		Bizservices.app.models.BizServiceSiteRelation.findOne({"where":{"bizSiteId":convertObjectIdToString(businessSiteId),"bizServiceId":convertObjectIdToString(businessServiceId)}}).then(providerSiteInfo=>{
	    		if(isValidObject(providerSiteInfo)){
	    			providerSiteInfo.updateAttributes({"isActive":false}).then(res=>{
	    				cb(null,{"success":true});
	    			}).catch(err=>{
	    				erroredRes = true;
	    				if(errorMessage!=""){errorMessage+=", ";}
	    				errorMessage+=" Error while processing provider id - "+businessProviderId;
	    				callbk();
	    			});
	    		}else{
	    			erroredRes = true;
	    			if(errorMessage!=""){errorMessage+=", ";}
	    			errorMessage+=" Invalid provider id "+businessProviderId+" or invalid site id "+businessSiteId;
	    			callbk();
	    		}
	    	}).catch(error=>{
	    		erroredRes = true;
	    		if(errorMessage!=""){errorMessage+=", ";}
	    		errorMessage+=" Error while processing provider "+businessProviderId;
	    		callbk();
	    	});

    	},function(){
    		if(erroredRes){
    			return cb(new HttpErrors.InternalServerError(errorMessage, {
	                expose: false
	            }));
    		}else{
    			return cb(null,{"success":true});
    		}
    	});
    }


};
