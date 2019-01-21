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

    Bizappointments.createAppointment = (appointmentInfo,businessSiteId, cb) => {
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


};
