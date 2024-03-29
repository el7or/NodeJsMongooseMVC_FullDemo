const express = require('express');
const { body, check } = require('express-validator');

const usersController = require('../controllers/users');
const User = require('../models/user');
const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/is-admin');
const { isEmail, isRequired } = require('../middleware/validators');
const fileHelper = require('../util/file');

const router = express.Router();

const userValidators = (isAdd) => {
    return [
        isRequired('name'),
        //isEmail('name'),
        body('name')
            .isLength({ min: 3 })
            .withMessage('This field at least 3 characters.')
            .custom((value, { req }) => {
                return User.findOne(isAdd ? { name: value } : { name: req.body.name, _id: { $ne: req.body.id } }).then(oldUser => {
                    if (oldUser) {
                        return Promise.reject('Username exists already, please pick a different one.');
                    }
                });
            })
            .trim(),
        body('password', 'Please enter a password with only numbers and text and at least 6 characters.')
            .isLength({ min: 6 })
            .isAlphanumeric()
            .trim(),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords have to match!');
                }
                return true;
            })
            .trim(),
        body('age')
            .not().isEmpty()
            .withMessage('This field is required.')
            .isFloat()
            .withMessage('Please enter vaild number.'),
        body('description')
            .not().isEmpty()
            .withMessage('This field is required.')
            .isLength({ min: 4, max: 400 })
            .withMessage('This field must be between 4 and 400 characters.'),
        body('roleId')
            .not().isEmpty()
            .withMessage('Please select the role.'),
        check('image')
            .custom((value, { req }) => {
                if (req.file && req.file.mimetype !== 'image/png' && req.file.mimetype !== 'image/jpg' && req.file.mimetype !== 'image/jpeg') {
                    fileHelper.deleteFile(req.file.path);
                    throw new Error('Attached file is not an image!');
                }
                return true;
            })
    ]
}

// /users-list => GET
router.get('/users-list', isAuth, usersController.getAllUsers);

// /users-details => GET
router.get('/user-details/:userId', isAuth, usersController.getUserById);

// /add-user => GET
router.get('/add-user', isAuth, usersController.getAddUser);
// /add-user => POST
router.post('/add-user', [isAuth, userValidators(true)], usersController.postAddUser);

// /edit-user/1 => GET
router.get('/edit-user/:userId', isAuth, usersController.getEditUser);

// /edit-user => POST
router.post('/edit-user', [isAuth, userValidators(false)], usersController.postEditUser);

// /delete-user => GET
router.delete('/user/:userId', isAuth, usersController.deleteUser);

// /download-user/1 => GET
router.get('/download-user/:userId', isAuth, usersController.getPdfUser);

module.exports = router;
//exports.routes = router;
