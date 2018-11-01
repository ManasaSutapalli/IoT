// Load the Cloudant library.
var Cloudant = require('@cloudant/cloudant');
var express = require('express');
var app = express();
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Initialize the cloudant library with my account.
var cloudant = Cloudant({ account: 'b5755589-bdf5-4da5-a118-cf8e199815b5-bluemix', password: 'c37a9cfb07cc91f16738f78a6fcb0155355acf77002314917685d90cbb7863d8' });
var db = cloudant.db.use('iot');

//route to render inserting equipment data view 
app.get('/addEquipment', function(req, res) {
    res.render('insert');
})

//api to handle post request for equipment data
app.post('/addEquipmentApi', function(req, res) {

    req.body = req.body.data;
    var json = {
        equipment_no: req.body.equipment_no,
        address: req.body.address,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        status: req.body.status
    };

    getEquipments('no', function(rows) {
        var flag = 0;
        for (i = 0; i < rows.length; i++) {
            // checking if equipment number is already exist
            if (rows[i].equipment_no == req.body.equipment_no) {
                flag = 1;
                break;
            }
        }

        //if exist throw error message
        if (flag) {

            var errorJson = {
                error: 'Sorry insertion failed'
            }
            res.json(errorJson);
        } else {

            //insert post data into db
            db.insert(json, function(err, body, headers) {
                if (err) {
                    var errorJson = {
                        error: 'Sorry insertion failed'
                    }
                    res.json(errorJson);
                } else {
                    res.json(body)
                }

            });
        }
    })

})

//function get single equipment data
var getSingleEquipment = function(id, callback) {
    db.get(id, function(err, data) {
        callback(data)
    });
}

// function to get all equipments based on limit value
var getEquipments = function(limit, callback) {
    var equipments = [];
    db.list(function(err, body, headers) {
        if (limit > body.rows.length || limit == 'no') {
            limit = body.rows.length;
        }

        if (limit < 1) {
            callback(equipments);
        } else {
            //loop to send each record id and store all data
            for (i = 0; i < limit; i++) {
                getSingleEquipment(body.rows[i].id, function(data) {
                    equipments.push(data);
                    if (equipments.length == limit) {
                        callback(equipments);
                    }

                })
            }
        }

    });
}

//route to display single equipment details
app.get('/getEquipmentDetails', function(req, res) {
    getSingleEquipment(req.query.id, function(data) {
        res.render('singleEquipment', { 'data': data });
    })
})

//route to display all equipments
app.get('/getAllEquipments', function(req, res) {
    var limit = req.query.limit;
    getEquipments(limit, function(response) {
        res.render('index', { 'data': response });
    })
})

// if route doesnot redirects to home page
app.get('*', function(req, res) {
    res.redirect('/getAllEquipments?limit=no');
});


app.listen('3000', function() {
    console.log('application running successfully ');
})