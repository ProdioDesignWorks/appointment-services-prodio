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
    	{
    		"bizServiceProviderId":"",
    		"firstName":"",
    		"lastName":"",
    		"email":"",
    		"mobileNumber":"",
    		"metaData":{}
    	}

    	let clientData = serviceProviderInfo;

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
                        cb(null,respponse);
                    }
                });
    		}else{
    			//create new
    			clientData["bizServiceProviderId"] = convertObjectIdToString(serviceProviderInfo["bizServiceProviderId"]);
    			clientData["isActive"] = true;
    			clientData["createdAt"] = new Date();

    			Bizserviceproviders.create(clientData).then(bizInfo=>{
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
    }

};
