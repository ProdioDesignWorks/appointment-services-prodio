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
                        cb(null,respponse);
                    }
                });
    		}else{
    			//create new
    			clientData["bizServiceId"] = convertObjectIdToString(serviceInfo["bizServiceId"]);
    			clientData["isActive"] = true;
    			clientData["createdAt"] = new Date();

    			Bizservices.create(clientData).then(bizInfo=>{
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
    }

};
