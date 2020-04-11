'use strict'

const express = require( 'express' )
const logger = require( 'morgan-debug' )
const bodyParser = require( 'body-parser' )
const debug = require( 'debug' )( 'speckle:errors' )

exports.init = ( ) => {
  const app = express( )

  if ( process.env.NODE_ENV !== 'test' ) {
    app.use( logger( 'speckle', 'dev', {} ) )
  }

  app.use( bodyParser.json( ) )
  app.use( bodyParser.urlencoded( { extended: false } ) )

  app.get( '/', ( req, res ) => {
    res.send( { fantastic: 'speckle' } )
  } )

  require( './modules' )( app )

  // Error responses
  app.use( ( err, req, res, next ) => {
    if ( process.env.NODE_ENV === 'test' ) {
      debug( err )
    }
    res.status( err.status || 500 )
    res.json( {
      message: err.message,
      error: err
    } )
  } )

  return app
}