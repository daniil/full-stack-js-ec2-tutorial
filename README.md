# Full Stack (React + Express + MySQL Deploy on AWS EC2)

## AWS Research (Heroku replacement)

- 12 months free offers
  - EC2 (750 hours per month - t2.micro)
  - S3 (5GB)
    - for JSON or file uploads, certainly not a necessity
  - RDS (750 hours per month)
    - possibly not even needed if we install MySQL on EC2
  - Alternatively: Elastic Beanstalk (Node), RDS (MySQL), S3 (React)
- After 12 months or if you go over monthly limit you pay standard AWS charges
  - https://aws.amazon.com/pricing?p=ft&c=hp&z=5
- You can manage your costs and usage using AWS Budgets
  - https://console.aws.amazon.com/billing/home?#/budgets&p=ft&c=hp&z=5
  - https://aws.amazon.com/getting-started/hands-on/control-your-costs-free-tier-budgets/



## AWS Setup Process

- Create an account
  - https://portal.aws.amazon.com/billing/signup
  - Verify the account email, create password, fill our contact information, provide CC information (able to take prepaid CCs), confirm phone number, select a support plan (free)



## EC2 Setup Process

- Search for EC2 service from the Dashboard
- Go to "Instances", then "Launch instances"
- Give it a name, ie: "deploy-full-stack"
- Pick Ubuntu > Ubuntu Server 22.04 LTS for Amazon Machine Image (AMI)
- Instance type is "t2.micro"
- In "Key pair (login)" select "Create new key pair", create "ED25519" with ".pem" and save it somewhere safe on your computer (need to remember where the key is for later)
  - If you creating another instance, you can select a key pair created before
- Under "Network settings" make sure to check "Allow HTTPs traffic from the internet" and "Allow HTTP traffic from the internet"
- You can click on "Launch instance" at this point
- Go back to "Instances" view, and your instance should be "Running" after a bit
- Click on the Instance ID and then "Connect" and pick "SSH client"
- Navigate to where you saved the .pem key, run the chmod command (`chmod 400 <key-file-name>.pem`) and then run the Example command to SSH into the instance. First time you are trying to connect, you will likely need to confirm the authenticity of host and allow to connect to the host by agreeing to connect and typing "yes".
- Keep in mind that if you stop and start the instance you might get a different URL for connecting over SSH or HTTP, so make sure you reference the correct one by referencing the dashboard
- Also keep in mind that instances are deployed to a particular region, so make sure to remember what region you have deployed your instance



## EC2 Instance Configuration Process

```
# update/refresh the list of available packages and upgrade them
sudo apt update
sudo apt upgrade

# create a linux swap file (to help with React builds on this low power hardware)
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
sudo su -c "echo '/swapfile swap swap defaults 0 0' >> /etc/fstab"

# install Node 16 LTS
cd ~
curl -sL https://deb.nodesource.com/setup_16.x -o /tmp/nodesource_setup.sh
sudo bash /tmp/nodesource_setup.sh
sudo apt install nodejs

# install NGINX as a reverse proxy & web server
sudo apt install -y nginx
```

If you are getting a message about a new kernel available, feel free to reboot the instance, after which you'll need to reconnect to it via SSH (and remember that URL will likely change):

```
sudo reboot
```

At this point you should be able to test NGINX working by going back to Instance summary and visiting the "Public IPv4 DNS". Keep in mind, that you will need to use the http version of the URL, not https. Simple way to ensure that is to select and copy the URL, instead of clicking on "open address".

Also keep in mind that Public IPv4 DNS might change when you restart the instance, so make sure you are referencing the correct URL.

If all works well, you will get a "Welcome to NGINX!" message. That's a good thing!



## Deploying the full stack app

First thing we need to do is setup the SSH key on EC2 instance to be able to connect to our GitHub account. In your EC2 instance, generate an SSH key, using the email you use to login to GitHub:

```
ssh-keygen -t rsa -b 4096 -C "your-email-address@email.com"
```

You can keep the default for the file to save SSH key in, which will be `/home/ubuntu/.ssh/id_rsa`. Also feel free to skip the passphrase step.

Change the file permissions to have it not publicly viewable and also add it to keychain:

```
chmod 600 /home/ubuntu/.ssh/id_rsa
eval `ssh-agent -s`
ssh-add -k /home/ubuntu/.ssh/id_rsa
```

And then copy and paste the public key to GitHub, either to general SSH keys or project specific Deploy Keys (under individual repo Settings > Deploy keys):

```
cat /home/ubuntu/.ssh/id_rsa.pub
```

At this point you should be able to clone the project from GitHub to the EC2 instance (feel free to do it in `~` folder).

Ensure you are copying the "SSH" URL under Code > Clone. First time you are trying to clone, you will likely need to confirm the authenticity of host and allow to connect to the host by agreeing to connect and typing "yes".

Next, go into the `/server` folder and install npm packages in it:

```
npm i
```

For client, go into the `/client` folder, and create an .env file (`sudo nano .env`) with following content: 

```
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

Then install packages and run a build script:

```
npm i
sh ./scripts/build.sh
```

Make sure that `build` script in React package.json looks like this:

```
"react-scripts --max_old_space_size=1024 build"
```

### Configuring NGINX

Configure NGINX sites-available to set up the client and server folders.

```
sudo rm /etc/nginx/sites-available/default
sudo nano /etc/nginx/sites-available/default
```

with this configuration:

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    # We want the root folder to point at index.html
    root /var/www/build;
    index index.html index.htm index.nginx-debian.html;

    server_name _;

    location / {
        # First attempt to serve request as file, then
        # as directory, then fall back to displaying a 404.
        try_files $uri /index.html $uri/ =404;
    }
    
    location /api {
        proxy_pass http://localhost:5050;
    }
}
```

You might need to restart the NGINX service at this point:

```
sudo systemctl reload nginx
```

At this point you should have working front-end, when you refresh the URL in the browser, with the spinner letting us know that we need to set up our API next.

### Configuring MySQL

First, install the MySQL server:

```
sudo apt install -y mysql-server
```

Then connect to the server and configure it (you probably want to change placeholder "rootroot" password to something more secure):

```
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'rootroot';
FLUSH PRIVILEGES;
exit
```

Next, create the database for the project:

```
mysql -u root -p
CREATE DATABASE `full_stack_deploy`;
exit
```

### Connecting to DB and starting backend server

In the `/server` folder, create an .env file (`sudo nano .env`) and fill in the DB connection details for knexfile:

```
NODE_ENV=production
DB_USER=root
DB_PASSWORD=rootroot
DB_DATABASE=full_stack_deploy
```

And run migrations and seeds:

```
sh ./scripts/db-setup.sh
```

And then start the Express app:

```
npm start
```



### Making updates

Any time client code changes, `git pull` latest changes and re-run the build script in `/client` folder:

```
sh ./scripts/build.sh
```

If you are having issues with build being stuck, try restarting the instance by running:

```
sudo reboot
```

Any time server code changes, `git pull` latest changes and restart the server:

```
npm run restart

## or if server restarted
npm start
```


### Running start script on instance restart

While SSHed into your instance, create a new per-boot script:

```
sudo nano /var/lib/cloud/scripts/per-boot/script.sh
```

With the following contents:

```
#!/bin/bash
sudo -u ubuntu bash << EOF
cd ~/test-deploy-full-stack/server
npm start
EOF
```

Where "test-deploy-full-stack" is the folder name of your app.

Then make sure to make the script executable:

```
sudo chmod 744 /var/lib/cloud/scripts/per-boot/script.sh
```

If you stop and start the instance again, it should restart your Node server (and NGINX will start up automatically).

To debug the start script, view the logs at `/var/log/cloud-init-output.log`. The logs are in chronological order, so make sure to scroll all the way to the bottom.



## Adding a custom domain name 

- Go into EC2 Dashboard > Network & Security > Elastic IPs
- Click on "Allocate Elastic IP address", keep all options as default and click "Allocate"
- Select the newly allocated IPv4 address and under Actions select "Associate Elastic IP address". Alternatively you can click on the address and select the same option.
- Under "Instance" select the EC2 instance of where your application is deployed, for Private IP address select the one that is suggested to you.
- You can test if it's working correctly by going to the Allocated IPv4 address and it should open up your application. Also this IP address will persist even after the instance restart.
- In your DNS management dashboard, create an "A" record, pointing to the Allocated IP as a value and using `@` as a host.
- Also add a "CNAME" record with "www" as a host and your DNS domain name as a value
- Allow 24-48 hours for DNS changes to propagate



## Adding an HTTPs Certificate

We're going to be using [Let's Encrypt](https://letsencrypt.org/) to get a free TLS certificate.

While SSHed into your EC2 instance, first, install Certbot and NGINX plugin:

```
sudo apt install certbot python3-certbot-nginx
```

Copy your current default site NGINX config to a separate domain version:

```
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/domain-name.com
```

Where "domain-name.com" would be your domain name. 

Open it up for editing:

```
sudo nano /etc/nginx/sites-available/domain-name.com
```

And update `server_name` value to your "domain-name.com" domain:

```
server_name domain-name.com www.domain-name.com
```

Restart NGINX service:

```
sudo systemctl reload nginx
```

Generate a certificate for your domain:

```
sudo certbot --nginx -d domain-name.com -d www.domain-name.com
```

Answer some questions, and then Certbot will request a certificate for your domain.

If all goes well and you get a message that certificate has been deployed successfully, you should be able to go to https://domain-name.com and see that your Connection is now secure (notice the lock sign on the left side of the URL bar).



## Stopping/restarting the instance

If you want to stop, start again or terminate the instance, under Instances interface, click on the Instance ID and under "Instance state" dropdown, select the needed action.

### Viewing all deployed instances

- [Global view](https://us-east-1.console.aws.amazon.com/ec2globalview/home)



## Taking it further

- Setting up budget rules for AWS



## References

- https://towardsdev.com/deploying-a-react-node-mysql-app-to-aws-ec2-2022-1dfc98496acf
- https://jasonwatmore.com/post/2019/11/18/react-nodejs-on-aws-how-to-deploy-a-mern-stack-app-to-amazon-ec2
