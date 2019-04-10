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

module.exports = function(Bizclients) {

	Bizclients.remoteMethod(
        'addEditClient', {
            http: {
                verb: 'post'
            },
            description: ["It will create client for the site."],
            accepts: [
            {
                arg: 'clientInfo',
                type: 'object',
                required: true,
                http: {
                    source: 'body'
                }
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

    Bizclients.addEditClient = (clientInfo,businessSiteId, cb) => {
    	// {
    	// 	"bizClientId":"",
    	// 	"firstName":"",
    	// 	"lastName":"",
    	// 	"email":"",
    	// 	"mobileNumber":"",
    	// 	"metaData":{}
    	// }

        if (!isNull(clientInfo["meta"])) {
            clientInfo = clientInfo["meta"];
        }

    	let clientData = clientInfo;

    	Bizclients.app.models.BizSites.findOne({"where":{"bizSiteId":convertObjectIdToString(businessSiteId)}}).then(businessInfo=>{
    		if(isValidObject(businessInfo)){
    			Bizclients.findOne(
		    		{ where: { "bizClientId": convertObjectIdToString(clientInfo["bizClientId"]) }}
		    	).then(bizUserInfo => {
		    		if (isValidObject(bizUserInfo)) {
		    			//Already exists
		    			clientData["bizClientId"] = bizUserInfo["bizClientId"];
		    			clientData["isActive"] = bizUserInfo["isActive"];

		    			bizUserInfo.updateAttributes(clientData,function(err,respponse){
		                    if(err){
		                        return cb(new HttpErrors.InternalServerError('Internal Server Error '+JSON.stringify(err), {
		                            expose: false
		                        }));
		                    }else{
		                    	funCreateClientSiteRelation(clientData["bizClientId"],bizUserInfo["moduleClientId"],businessInfo["bizSiteId"],businessInfo["moduleSiteId"]);
		                        cb(null,respponse);
		                    }
		                });
		    		}else{
		    			//create new
		    			clientData["bizClientId"] = convertObjectIdToString(clientInfo["bizClientId"]);
		    			clientData["bizSiteId"] = convertObjectIdToString(clientInfo["bizSiteId"]);
		    			clientData["isActive"] = true;
		    			clientData["createdAt"] = new Date();

		    			Bizclients.create(clientData).then(bizInfo=>{
		                    funCreateClientSiteRelation(bizInfo["bizClientId"],bizInfo["moduleClientId"],businessInfo["bizSiteId"],businessInfo["moduleSiteId"]);
		    				return cb(null,bizInfo);
		    			}).catch(err=>{
		    				return cb(new HttpErrors.InternalServerError('Error while creating new client.', {
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
    	})

    	
    }

    function funCreateClientSiteRelation(sysClientId,moduleClientId,sysSiteId,moduleSiteId){
    	Bizclients.app.models.BizClientSiteRelation.findOne({"where":{"moduleClientId":moduleClientId,"moduleSiteId":moduleSiteId}}).then(response=>{
    		if(isValidObject(response)){
    			response.updateAttributes({"isActive":true}).then(updatedInfo=>{

    			}).catch(error=>{
		    		
		    	});

    		}else{
    			let insertJson = {
    				"bizClientId":sysClientId,
    				"moduleClientId":moduleClientId,
    				"bizSiteId":sysSiteId,
    				"moduleSiteId": moduleSiteId,
    				"createdAt": new Date(),
    				"isActive": true
    			};

    			Bizclients.app.models.BizClientSiteRelation.create(insertJson).then(response=>{

    			}).catch(error=>{
		    		
		    	});

    		}
    	}).catch(error=>{
    		
    	});
    }


    Bizclients.remoteMethod(
        'listClients', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
                { arg: 'businessSiteId', type: 'string', required: true, http: { source: 'query' } },
                { arg: 'pageNo', type: 'string', required: false, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizclients.listClients = (businessSiteId,pageNo, cb) => {
    	if(isNull(pageNo)){pageNo=0;}
    	let limit = 10;

    	let filterObject = {"where":{"bizSiteId":convertObjectIdToString(businessSiteId),"isActive":true},"include":[{relation:'Client'}]};

		filterObject.skip = parseInt(pageNo) * parseInt(limit);
		filterObject.limit = limit;
            
    	Bizclients.app.models.BizClientSiteRelation.find(filterObject).then(bizClients=>{
    		cb(null,bizClients);
    	}).catch(error=>{
    		let _msg = isNull(error["message"]) ? 'Internal Server Error' : error["message"];
            const err = new HttpErrors.InternalServerError(_msg, {
                expose: false
            });
            return cb(err);
    	});
    }


    Bizclients.remoteMethod(
        'removeClientFromSite', {
            http: {  verb: 'post'  },
            description: ["It will create appointment for the site."],
            accepts: [
                { arg: 'businessClientIds', type: 'array', required: true, http: { source: 'query' } },
                { arg: 'businessSiteId', type: 'string', required: true, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizclients.removeClientFromSite = (businessClientIds,businessSiteId, cb) => {
    	let clientsArr = String(businessClientIds).split(",");
    	let erroredRes = false; let errorMessage = "";

    	async.each(clientsArr,function(businessClientId,callbk){
    		Bizclients.app.models.BizClientSiteRelation.findOne({"where":{"bizSiteId":convertObjectIdToString(businessSiteId),"bizClientId": convertObjectIdToString(businessClientId)}}).then(clientSiteInfo=>{
	    		if(isValidObject(clientSiteInfo)){
	    			clientSiteInfo.updateAttributes({"isActive":false}).then(res=>{
	    				callbk();
	    			}).catch(err=>{
	    				erroredRes = true;
	    				if(errorMessage!=""){errorMessage+=", ";}
	    				errorMessage+=" Error while processing "+businessClientId;
	    				callbk();
	    			});
	    		}else{
	    			erroredRes = true;
	    			if(errorMessage!=""){errorMessage+=", ";}
	    			errorMessage+=" Invalid client id "+businessClientId+" or invalid site id "+businessSiteId;
	    			callbk();
	    		}
	    	}).catch(error=>{
	    		erroredRes = true;
	    		if(errorMessage!=""){errorMessage+=", ";}
	    		errorMessage+=" Error while processing "+businessClientId;
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
