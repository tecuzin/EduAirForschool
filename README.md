<h1>Definition</h1>

<h1>Requirement</h1>
Although the first version of EduAir in this repository (https://github.com/EduAir/EduAir) was running on a Raspberry, this version which is more complete with a system of communication and collaboration using other open source software such as EtherPad requires at least 4 GB of RAM and a disk with a storage space of 120 GB minimum for a good start in production.

The Linux distribution used for this release is Ubuntu 14.04 any higher version should not cause any worries.

As a server we use Intel NUC Core i3 to install EduAir. You can decide if you want to choose another type of higher hardware in terms of computing power. We do not guarantee the operation with equipment below those recommended but it would be good news to let us know if it works.

<h1>Installation</h1>

Here is the list of packages to install on the linux server to run EduAirForSchool

-	Nodejs 
EduAir run on a NodeJs server.
-	Ffmpeg
-	Elasticsearch (https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-elasticsearch-on-ubuntu-14-04)
-	MongoDb (https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)
-	A hostpot (http://techapple.net/2014/07/procedure-create-wifi-hotspot-linux-creating-wireless-access-point-linux-ubuntulinuxmintfedoraopensuse/)
-	ImageMagik 
<code>sudo apt-get update
sudo apt-get install imagemagick ghostscript poppler-utils</code>
-	LibreOffice 
<code> apt-get install libreoffice --no-install-recommends</code>
-	Convertor to text
For PDF File
 <code>sudo apt-get install poppler-utils</code>

For Pictures:
 <code>sudo apt-get install tesseract-ocr
sudo apt-get install ghostscript</code>
For Word (Office)
<code>sudo apt-get install antiword</code>
-	File preview (thumbnail)
<code>code>sudo apt-get install unoconv</code>
-	Convert PDF file to image
<code>sudo apt-get install python-software-properties
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:rwky/graphicsmagick
sudo apt-get update
sudo apt-get install graphicsmagick</code>
-<code>	sudo npm install --unsafe-perm</code>

Put the clone of this repository in directory of your choice and make a
<code>node server.js </code> to launch it
Warning! it listens on the port 80 so make sure this port is free on your server.
Then type the IP address of your server on your browser to open the application
To add new files to your server, just add "/upload" in front of your IP address on the browser.
