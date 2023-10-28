from flask import Flask, redirect, url_for,render_template,request,session,flash,jsonify
from flask_bcrypt import Bcrypt #User authentication 
from datetime import timedelta
from flask_sqlalchemy import SQLAlchemy
import os
import random #so many dependencies.... random is for shuffling tunes
#import SRCNN.test as srcnn



app = Flask(__name__, static_folder='static')
app.config['UPLOAD_FOLDER'] = '/uploads'


bcrypt = Bcrypt(app)
#app.register_blueprint(admin, url_prefix="")
app.secret_key = "help!"
app.permanent_session_lifetime = timedelta(days=3)


app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
app.config['SQLALCHEMY_TRACH_MODIFICATIONS'] = True


db = SQLAlchemy(app)

class utility(db.Model):
    _id = db.Column("id",db.Integer, primary_key=True)
    name = db.Column("name", db.String(200),nullable=False)
    param = db.Column(db.Integer)

    def __init__(self,name,param):
        self.name = name
        self.param = param

class users(db.Model):
    _id = db.Column("id", db.Integer, primary_key=True)
    name = db.Column("name", db.String(200),nullable=False)
    email = db.Column(db.String(200))
    password = db.Column(db.String(200))
    sex = db.Column(db.String(8))

    def __init__(self,name,email,password,sex=None):
        self.name = name
        self.email = email
        self.password = password

class entries(db.Model):
    _id = db.Column("id", db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    author = db.Column(db.String(200))
    content = db.Column(db.String(3000))

    def __init__(self,_id,title,content,author="Author not found"):
        self._id=_id
        self.title = title
        self.content = content
        self.author = author

    def get(self):
        return {'id':self._id,'title':self.title,'content':self.content,'author':self.author}

class replies(db.Model):
    _id = db.Column("id", db.Integer, primary_key=True)
    adressing_id = db.Column(db.String(100))
    name  = db.Column(db.String(200))
    reply = db.Column(db.String(1000))

    def __init__(self,name,adressing_id,reply):
        self.name = name
        self.adressing_id = adressing_id
        self.reply = reply

    def get(self):
        return {'name':self.name,'adressing_id':self.adressing_id,'reply':self.reply}

@app.route("/api", methods = ["GET"])
def getAPI():
    return jsonify([1,2,3])

@app.route("/api_music_list", methods = ["GET"])
def get_music_list():
    user = ""
    if "user" not in session:
        user_music = []
    else:
        user = session["user"]
        user_music = os.listdir(f"static/music/{user}")
    music = os.listdir(f"static/music/Default_user")
    return jsonify({"user":user,"music":music,"user_music":user_music})

@app.route("/api_entries",methods = ["GET","POST"])
def get_entries():
    music=[]
    user_music=[]
    if "user" not in session:
        user = "Default_user"
    else:
        user = session["user"]
        if request.method == "POST" and request.form["submit_title"] != "":
            utility.query.filter_by(name="Last_entry_id").first().param += 1
            last_post_id = utility.query.filter_by(name="Last_entry_id").first().param
            db.session.add(entries(last_post_id, request.form["submit_title"],request.form["submit_content"],session["user"]))
            db.session.commit()
            return jsonify({"ret":"posted"})

    videos = os.listdir("static/videos")
    entries_found = [e.get() for e in entries.query.all()][::-1] #latest on top
    return jsonify({"user":user,"entires":entries_found,
                        "videos":videos})



@app.route("/admin", methods = ["GET","POST"])
def admin_page():
    music = os.listdir(f"static/music/Default_user")
    if "user" in session:
        pass
    else:
        return redirect(url_for("home"))
    if session["user"] == "Vogel":
        if request.method == "POST":
            admin_delete(request.form["del_button"])
            return redirect(url_for("admin_page"))
        else:
            return render_template("admin.html", 
            name="admin",values=users.query.all(),
            music=music,
            entries=entries.query.all(),
            found_replies=replies.query,
            last_post_id=utility.query.filter_by(name="Last_entry_id").first().param,
            last_reply_id=utility.query.filter_by(name="Last_reply_id").first().param
            )

    else:
        return redirect(url_for("home"))




@app.route("/", methods = ["GET","POST"])
def home():
    music=[]
    user_music=[]
    if "user" not in session:
        user = "Default_user"
    else:
        user = session["user"]
        user_music = os.listdir(f"static/music/{user}")
        if request.method == "POST" and request.form["submit_title"] != "":
            utility.query.filter_by(name="Last_entry_id").first().param += 1
            last_post_id = utility.query.filter_by(name="Last_entry_id").first().param
            db.session.add(entries(last_post_id, request.form["submit_title"],request.form["submit_content"],session["user"]))
            db.session.commit()
            return jsonify({'ret':"post_submitted"})
    videos = os.listdir("static/videos")
    return render_template("index.html",name=user,values=entries.query.all(),videos=videos)


@app.route("/videos/<video_id>")
def videos(video_id):
    music = os.listdir(f"static/music/Default_user")
    return render_template("media.html",video_id=video_id,music=music)

@app.route("/test")
def test():
    user_music=[]
    user='Default_user'
    music = os.listdir(f"static/music/Default_user")
    if "user" in session:
        pass
    return render_template("test.html")

@app.route("/upload", methods = ["GET","POST"])
def upload():
    music = os.listdir(f"static/music/Default_user")
    if "user" in session:
        file=""
        if request.method == 'POST':
            print(f"{session['user']}is trying to upload a file")
            f = request.files['file']
            file_name = request.form['file_name']
            print(f"User={session['user']} is trying to upload a file name:{file_name}")
            sort_file(f,session['user'],file_name) # sort and save the file, don't know don't care
        return render_template("upload.html",music=music)
    else:
        return redirect(url_for('home'))


@app.route("/posts/<post_id>", methods = ["GET","POST"])
def posts(post_id):
    user='Default_user'
    user_music=[]
    found_post=entries.query.filter_by(_id=post_id).first()
    if found_post:
        post_id=found_post._id
        post_title=found_post.title
        post_content=found_post
        if request.method == "POST":
            if "user" in session and request.form["reply_content"] != "":
                db.session.add(replies(session["user"], post_id, request.form["reply_content"]))
                utility.query.filter_by(name="Last_reply_id").first().param += 1
        db.session.commit()
        found_replies=replies.query.filter_by(adressing_id=post_id).all()

        if "user" in session:
            user = session["user"]
            user_music=os.listdir(f"static/music/{user}")
        music = os.listdir(f"static/music/Default_user")

        return render_template("posts.html", found_post=found_post,replies=found_replies[::-1],user_music=user_music,name=user,music=music)

    else:
        return "<h1> No relevant page found!!!</h1>"
    

@app.route("/login", methods = ["GET","POST"])
def login_page():
    error = ""
    music = os.listdir(f"static/music/Default_user")
    try:
        if request.method == "POST":
            session.permanent = True
            user_name = request.form["user_name"]
            password = request.form["password"]
            found_user = users.query.filter_by(name=user_name).first()
            if found_user: 
                if bcrypt.check_password_hash(found_user.password, password):#check if hash is correct
                    session["user"] = found_user.name
                    session["email"] = found_user.email
                    flash("You are logged in", "info")
                    return redirect(url_for("user"))
                else:
                    raise Exception("Invalid Credentials")
            else:
                raise Exception("No User")
        else:
            return render_template("login.html",music=music)

    except Exception as e:
        error=e
        return render_template("login.html", error = error,music=music)



@app.route("/register", methods = ["GET","POST"])
def register():
    email = None
    if request.method == "POST":
        session.permanent = True
        user_name = request.form["user_name"]
        email = request.form["email"]
        pas=request.form["password"]
        password = bcrypt.generate_password_hash(pas)
        found_user = users.query.filter_by(name=user_name).first()
        if found_user:
            flash("Account has been registered!!!","error_registration")
            return render_template("register.html")
        else:
            session["user"] = user_name
            session["email"] = email
            db.session.add(users(user_name,email,password))
            db.session.commit()
            flash(f"Account Created, your email is {email}", "info")
            try:
                os.mkdir(f'static/music/{user_name}') 
            except Exception as e:
                pass
            return redirect(url_for("user"))

    else:
        return render_template("register.html")


@app.route("/logout")
def logout():
    session.pop("user", None)
    session.pop("email",None)
    flash("You are logged out", "info")
    return redirect(url_for("home"))



@app.route("/user")
def user():
    if "user" in session:
        print(session)
        user = session["user"]
        email = session["email"]
        music=os.listdir(f"static/music/Default_user")
        user_music=os.listdir(f"static/music/{user}")

        return render_template("user.html",name=user,email=email,music=music,user_music=user_music)
    else:
        print("user not in session")
        return redirect(url_for("login_page"))


def admin_delete(return_dict):
    del_type = request.form["del_button"].split()[0]
    del_id = int(request.form["del_button"].split()[1])
    power_del = int(request.form["del_button"].split()[2])
    print(del_type)
    if del_type == "entry":
        if entries.query.get(del_id).content != "<h1>The Content has been deleted</h1><p>Der Inhalt wurde gelöscht</p>":
            entries.query.get(del_id).content = "<h1>The Content has been deleted</h1><p>Der Inhalt wurde gelöscht</p>"
            entries.query.get(del_id).title = "[Deleted]"+ entries.query.get(del_id).title
            print("entry f{del_id} has been deleted")
        else:
            print("entry already been deleted, try to use power delete")
        if power_del == 1:
            db.session.delete(entries.query.get(del_id))
            replies.query.filter_by(adressing_id=del_id).delete()
    if del_type == "reply":
        if replies.query.get(del_id).reply != "<h3>This Reply has been deleted</h1><p>Diese Erwiderung wurde gelöscht</p>":
            replies.query.get(del_id).reply = "<h3>This Reply has been deleted</h1><p>Diese Erwiderung wurde gelöscht</p>"
            print(f"reply {del_id} has been deleted")
        else:
            print("reply already been deleted, try to use power delete")
        if power_del == 1:
            db.session.delete(replies.query.get(del_id))
    if del_type == "user":
         db.session.delete(users.query.get(del_id))
         print("user {del_id} been deleted")

    db.session.commit()


def sort_file(file,user,file_name):
    print(file.name)
    if file.filename.endswith('.mp3'):
        print(f'{user} uploaded a mp3 track')
        file.save('static/music/' + user +"/"+file_name + '.mp3')

    elif file.filename.endswith('.wav'):
        print(f'{user} uploaded a wav track')
        file.save('static/music/' + user+"/"+file_name + '.wav')

    elif file.filename.endswith('.mp4'):
        print(f'{user} uploaded a mp4 video')
        file.save('static/videos/' + file_name + '.mp4')


if __name__ == "__main__":
    context = ('server.crt', 'server.key')#certificate and key files
    with app.app_context():
        db.create_all()
        db.session.add(utility("Last_entry_id",20))
        db.session.add(utility("Last_reply_id",20))
        db.session.commit()
    
    app.run(debug=False,host='0.0.0.0', port=8080)