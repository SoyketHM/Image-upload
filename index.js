const express   = require('express');
const multer    = require('multer');
const jimp      = require('jimp');
const uuid      = require('uuid');
const _p 		= require('./simpleasync');
const app       = express();
const port      = 5000;

const storage = multer.memoryStorage();
const store = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './images');
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now());
    }
});

const upload = multer({
    storage: storage,
    limits: {fileSize: 1000000},
    fileFilter: function (req, file, cb) {
        const fileExts = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
        const isAllowedExt = fileExts.includes(file.originalname.split('.')[1].toLowerCase());
        const isAllowedMimeType = file.mimetype.startsWith("image/");
        if (isAllowedExt && isAllowedMimeType) {
            return cb(null, true)
        }
        else {
            cb('File type not allowed!')
        }
    }
});
const photoUrl = [
    {id: '1', photo: 'images/photo-1566372491949'},
    {id: '2', photo: 'images/photo-1566372491949'},
    {id: '3', photo: 'images/photo-1566372491949'}
];

const resize = async (req, res, next) => {
    if (!req.file) {
        next();
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    const [perr, photo] = await _p(jimp.read(req.file.buffer));
    if (!perr) {
        if( photo.bitmap.width > 400 ) {
            photo.resize(400, jimp.AUTO);
            photo.quality(60);
            photo.write(`./images/${req.body.photo}`);
            next();
        }
        photo.write(`./images/${req.body.photo}`);
        next();
    } else {
        return reject(perr.message);
    }
};

//get
app.get('/', (req, res) => {
    res.json({message: 'Hello World!'});
});

//get file by id
app.get('/:id', (req, res) => {
    const photoFound = photoUrl.find( p => p.id ===  req.params.id);
    if(photoFound) {
        res.json( photoFound );
    } else {
        res.json({message: 'photo not found'});
    }
});

// upload single image
app.post('/profile', upload.single('photo'), resize, async (req, res) => {
    const photoExist = photoUrl.find( p => p.id ===  req.body.id);
    if (!photoExist) {
        const data = {
            id: req.body.id,
            photo: req.body.photo
        };
        await photoUrl.push(data);
        res.send({'message': 'File uploaded successfully'});
    }else{
        const id = photoExist.id;
        const pindex = await photoUrl.findIndex(p => p.id === id);
        photoUrl[pindex].photo = req.body.photo;
        res.json({message: 'photo exist', photoUrl });
    }

});

// // upload multiple image
// app.post('/api/photo',function(req,res){
//     upload(req,res,function(err) {
//         //console.log(req.body);
//         //console.log(req.files);
//         if(err) {
//             return res.end("Error uploading file.");
//         }
//         res.end("File is uploaded");
//     });
// });


app.listen(port, () => console.log(`server listening on port ${port}...`));