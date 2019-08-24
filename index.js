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

const uploads = multer({
    storage: store,
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

const photoUrls = [
    {id: '1', photo: ['images/photo-1566372491949', 'images/photos-1566627651390']},
    {id: '2', photo: ['images/photos-1566627651387', 'images/photos-1566627651390']},
    {id: '3', photo: ['images/photos-1566627651390', 'images/photos-1566627651387']}
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

const resizes = async (req, res, next) => {
    if (!req.files) {
        next();
        return;
    }
    req.files.forEach(async p => {
        console.log(p);
        const extension = p.mimetype.split('/')[1];
        req.body.photos =`${uuid.v4()}.${extension}`;
        console.log(req.body.photos);
        const [perr, photo] = await _p(jimp.read(p.buffer));
        console.log(p.buffer);
    });

    // console.log(req.body.photos);
    // const extension = req.files.mimetype.split('/')[1];
    // req.body.photos = `${uuid.v4()}.${extension}`;
    // const [perr, photo] = await _p(jimp.read(req.file.buffer));
    // if (!perr) {
    //     if( photo.bitmap.width > 400 ) {
    //         photo.resize(400, jimp.AUTO);
    //         photo.quality(60);
    //         photo.write(`./images/${req.body.photo}`);
    //         next();
    //     }
    //     photo.write(`./images/${req.body.photo}`);
    //     next();
    // } else {
    //     return reject(perr.message);
    // }
};

//get
app.get('/', (req, res) => {
    res.json({message: 'Hello World!'});
});

//get image by id
app.get('/:id', (req, res) => {
    const photoFound = photoUrl.find( p => p.id ===  req.params.id);
    if(photoFound) {
        res.json( photoFound );
    } else {
        res.json({message: 'photo not found'});
    }
});

// upload single image
app.post('/profile', upload.single('photo'), resize, (req, res) => {
    const photoExist = photoUrl.find( p => p.id ===  req.body.id);
    console.log(req.file);
    if (!photoExist) {
        const data = {
            id: req.body.id,
            photo: req.body.photo
        };
        photoUrl.push(data);
        res.send(photoExist);
    }else{
        const id = photoExist.id;
        const pindex = photoUrl.findIndex(p => p.id === id);
        photoUrl[pindex].photo = req.body.photo;
        res.json({message: 'photo exist', photoUrl });
    }

});

// upload multiple image
app.post('/photos', uploads.array('photos', 2), (req, res) => {
console.log(req.files);
    const photoExist = photoUrls.find( p => p.id ===  req.body.id);
    const photos = [];
    req.files.forEach(e => photos.push(e.path));
    if (!photoExist) {
        const data = {
            id: req.body.id,
            photos: photos
        };
        photoUrls.push(data);
        res.send({'message': 'File uploaded successfully', data});
    }else{
        const id = photoExist.id;
        const pindex = photoUrls.findIndex(p => p.id === id);
        photoUrls[pindex].photo = photos;
        res.json({message: 'photo exist', photoUrls });
    }
});


app.listen(port, () => console.log(`server listening on port ${port}...`));