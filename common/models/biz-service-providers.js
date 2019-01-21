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

module.exports = function(Bizserviceproviders) {

	Bizserviceproviders.remoteMethod(
        'addEditServiceProvider', {
            http: {
                verb: 'post'
            },
            description: ["It will create service provider for the site."],
            accepts: [{
                arg: 'serviceProviderInfo',
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

    Bizserviceproviders.addEditServiceProvider = (serviceProviderInfo,businessSiteId, cb) => {
    	// {
    	// 	"bizServiceProviderId":"",
    	// 	"firstName":"",
    	// 	"lastName":"",
    	// 	"email":"",
    	// 	"mobileNumber":"",
    	// 	"metaData":{}
    	// }

    	let clientData = serviceProviderInfo;
    	Bizserviceproviders.app.models.BizSites.findOne({"where":{"bizSiteId":convertObjectIdToString(businessSiteId)}}).then(businessInfo=>{
    		if(isValidObject(businessInfo)){

    			Bizserviceproviders.findOne(
		    		{ where: { "bizServiceProviderId": convertObjectIdToString(bizData["bizServiceProviderId"]) }}
		    	).then(bizUserInfo => {
		    		if (isValidObject(bizUserInfo)) {
		    			//Already exists
		    			clientData["bizServiceProviderId"] = bizUserInfo["bizServiceProviderId"];
		    			clientData["isActive"] = bizUserInfo["isActive"];

		    			bizUserInfo.updateAttributes(clientData,function(err,respponse){
		                    if(err){
		                        return cb(new HttpErrors.InternalServerError('Internal Server Error '+JSON.stringify(err), {
		                            expose: false
		                        }));
		                    }else{
		                    	funCreateProviderSiteRelation(bizUserInfo["bizServiceProviderId"],bizUserInfo["moduleServiceProviderId"],businessInfo["bizSiteId"],businessInfo["moduleSiteId"]);

		                        cb(null,respponse);
		                    }
		                });
		    		}else{
		    			//create new
		    			clientData["bizServiceProviderId"] = convertObjectIdToString(serviceProviderInfo["bizServiceProviderId"]);
		    			clientData["isActive"] = true;
		    			clientData["createdAt"] = new Date();

		    			Bizserviceproviders.create(clientData).then(bizInfo=>{
		    				funCreateProviderSiteRelation(bizInfo["bizServiceProviderId"],bizInfo["moduleServiceProviderId"],businessInfo["bizSiteId"],businessInfo["moduleSiteId"]);
		    				return cb(null,bizInfo);
		    			})catch(err=>{
		    				return cb(new HttpErrors.InternalServerError('Error while creating new service provider.', {
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
    		let _msg = isNull(error["message"]) ? 'Internal Server Error' : error["message"];
            const err = new HttpErrors.InternalServerError(_msg, {
                expose: false
            });
            return cb(err);
    	});

    	
    }

    function funCreateProviderSiteRelation(sysProviderId,moduleProviderId,sysSiteId,moduleSiteId){
    	Bizserviceproviders.app.models.BizProviderSiteRelation.findOne({"where":{"moduleProviderId":moduleProviderId,"moduleSiteId":moduleSiteId}}).then(response=>{
    		if(isValidObject(response)){
    			response.updateAttributes({"isActive":true}).then(updatedInfo=>{

    			}).catch(error=>{
		    		
		    	});

    		}else{
    			let insertJson = {
    				"bizProviderId":sysProviderId,
    				"moduleProviderId":moduleProviderId,
    				"bizSiteId":sysSiteId,
    				"moduleSiteId": moduleSiteId,
    				"createdAt": new Date(),
    				"isActive": true
    			};

    			Bizserviceproviders.app.models.BizProviderSiteRelation.create(insertJson).then(response=>{

    			}).catch(error=>{
		    		
		    	});

    		}
    	}).catch(error=>{
    		
    	});
    }


    Bizserviceproviders.remoteMethod(
        'listServiceProviders', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
                { arg: 'businessSiteId', type: 'string', required: true, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizserviceproviders.listServiceProviders = (businessSiteId, cb) => {
    	Bizserviceproviders.app.models.BizProviderSiteRelation.find({"where":{"bizSiteId":businessSiteId,"isActive":true},"include":[{relation:'ServiceProvider'}]}).then(bizProviders=>{
    		cb(null,bizProviders);
    	}).catch(error=>{
    		let _msg = isNull(error["message"]) ? 'Internal Server Error' : error["message"];
            const err = new HttpErrors.InternalServerError(_msg, {
                expose: false
            });
            return cb(err);
    	});
    }


    Bizserviceproviders.remoteMethod(
        'removeServiceProviderFromSite', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
                { arg: 'businessProviderIds', type: 'array', required: true, http: { source: 'query' } }
                { arg: 'businessSiteId', type: 'string', required: true, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizserviceproviders.removeServiceProviderFromSite = (businessProviderIds,businessSiteId, cb) => {

    	let providerArr = String(businessProviderIds).split(",");
    	let erroredRes = false; let errorMessage = "";

    	async.each(providerArr,function(businessProviderId,callbk){
    		Bizserviceproviders.app.models.BizProviderSiteRelation.findOne({"where":{"bizSiteId":businessSiteId,"bizProviderId":businessProviderId}}).then(providerSiteInfo=>{
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
