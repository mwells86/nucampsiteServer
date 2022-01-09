const express = require('express');
const Favorite = require('../models/favorite');
const favoriteRouter = express.Router();
const authenticate = require('../authenticate');
const cors = require('./cors');

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.statusCode(200))
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({user: req.user._id})
    .populate('user')
    .populate('campsites')
    .then(favorites => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json')
        res.json(favorites);
    })
    .catch(err => next(err))
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    const newFavorites = req.body;
    Favorite.findOne({user: req.user._id})
    .then(favorites => {
        if(favorites) {
            newFavorites.forEach(newFavorite => {
                if(!favorites.campsites.includes(newFavorite._id)){
                    favorites.campsites.push(newFavorite)
                }
            })
            favorites.save()
            .then(updatedFavorites => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            })
            .catch(err => next(err));
        }
        else {
            Favorite.create({user: req.user._id, campsites: req.body})
            .then(favorites => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            })
            .catch(err => next(err))
        }
    })
    .catch(err => next(err))
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOneAndDelete({user: req.user._id})
    .then(response => {
        if(response) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(response);
        } 
        else {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'text/plain');
            res.end("You do not have any favorites to delete");
        }       
    })
    .catch(err => next(err))
})


favoriteRouter.route('/:campsiteId')
.options(cors.corsWithOptions, (req, res) => res.statusCode(200))
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id})
    .then(favorites => {
        if(favorites) {
            if(!favorites.campsites.includes(req.params.campsiteId)) {
                favorites.campsites.push(req.params.campsiteId);
                favorites.save()
                .then(favorite => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })
                .catch(err => next(err))
            }
            else {
                res.end("That campsite is already in the list of favorites!")
            }
        }
        else {
            Favorite.create({user: req.user._id, campsites: [req.params.campsiteId]})
            .then(favorites => {
                console.log("Favorite campsites record created");
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            })
            .catch(err => next(err))
        }
    })
    .catch(err => next(err))
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation not supported on /favorites/${req.params.campsiteId}`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id})
    .then(favorites => {
        if(favorites) {
            if(favorites.campsites.includes(req.params.campsiteId)) {
                const updatedCampsites = favorites.campsites.filter(campsite => campsite != req.params.campsiteId);
                favorites.campsites = updatedCampsites;
                favorites.save()
                .then(updatedFavorites => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(updatedFavorites);
                })
                .catch(err => next(err))
            } else {
                res.setHeader('Content-Type', 'text/plain');
                res.end(`Campsite ${req.params.campsiteId} is not a favorite`);
            }
        }
        else {
            res.setHeader('Content-Type', 'text/plain');
            res.end("There are no favorites to delete");
        }
    })
})

module.exports = favoriteRouter;