
require 'capistrano/s3'

set :deployment_path, "_site"
set :bucket, "intercoolerjs.org"
set :access_key_id, ENV['AWS_ACCESS_KEY']
set :secret_access_key, ENV['AWS_SECRET_KEY']

# set :s3_endpoint, 's3-us-west-1.amazonaws.com'

before 'deploy' do
  run_locally "jekyll build"
end
