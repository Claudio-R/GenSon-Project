import logging
from flask import Flask, render_template

app = Flask(__name__)
@app.route('/test')
def test():
  app.logger.warning('testing warning log')
  app.logger.error('testing error log')
  app.logger.info('testing info log')
  return "Check your console"
