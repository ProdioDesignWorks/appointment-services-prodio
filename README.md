Appointments Module (Prodio DesignWorks)
========================================

### Organize your business! Exploit human resources that can be used in other tasks more efficiently.

**PDW Appointments** is a highly customizable application apis that allows your customers to book appointments with you. PDW Appointments will run smoothly with your existing website, because it can be installed in a single folder of the server and of course, both sites can share the same database.

### Features

The project was designed to be flexible and reliable so as to be able to meet the needs of any
kind of enterprise. You can read the main features of the system below:

* Business management
	* Clients Listing
    * Services
    * Staff
    * Availability
    * Appointments
* Services and service providers organization.
	* Organizations will be able to add all the services they provide including each service provider with working hours system.
* Workflow and booking rules.
	* Define cancellation or appointment confirmation time periods.


### Functions

* Add/Edit Business Site

* Add/Edit Services

* Add/Edit Service Providers

* Add/Edit Clients

* Book Appointment

* Reschedule Appointment

* Cancel Appointment

* Edit Appointment

* TimeSlot Settings


### Installation

1. Clone this repository on your server `git clone https://github.com/ProdioDesignWorks/appointment-services-prodio.git`
2. Navigate to your repo `cd appointment-services-prodio`
3. Install dependencies `npm install`
4. Start service `node .` or `npm start` or `node server/server.js`
5. Open `http://localhost:3030/explorer/` in your browser (Note: The port 3030 should be allowed in server firewall OR In the AWS Security Groups)
6. If you've pm2 installed then use this `pm2 start server/server.js --name="APPOINTMENT_SERVICE"`
#### NOTE: 
`appointment-services-prodio` uses loopback as the core framework for developing API's, so all customisations, configurations, middlewares, events, and db connectors can be used which you would have used in loopback.


## Author

PDW Appointments is developed and maintained by [Prodio DesignWorks](http://www.prodio.in).
