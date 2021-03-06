import React from "react";
import ScoreResult from "../../components/score-result/score-result";
import "./profile.scss";
import axios from "axios";
import { env } from "../../env/development";
import _ from "lodash";
import playerProfile from "../../img/profile_picture.png";
import ErrorHandleDialog from "../../components/error-handle-dialog/error-handle-dialog";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import Button from "@material-ui/core/Button";

class Profile extends React.Component {
  constructor() {
    super();
    this.state = {
      id: 0,
      name: "",
      password: "",
      n5Score: 0,
      n4Score: 0,
      image: {},
      profilePicture: {},
      examRecord: [],
      practiseRecord: [],
      examRecordN5: [],
      examRecordN4: [],
      practiseRecordN5: [],
      practiseRecordN4: [],
      isGuest: true,
      isError: false,
      errorMessage: "",
      errorStatus: 0,
      open: false,
      pending: false,
      success: false, 
      change: false
    };
    this.fileChooser = React.createRef();
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleOnChange = this.handleOnChange.bind(this);
    this.errorDialogClose = this.errorDialogClose.bind(this);
  }
  componentDidMount() {
    let examN5 = [];
    let examN4 = [];
    let practiseN5 = [];
    let practiseN4 = [];
    const loginUser = JSON.parse(localStorage.getItem("loginUser"));
    let jwt = loginUser && loginUser.jwt ? loginUser.jwt : "";
    const headers = { Authorization: `Bearer ${jwt}` };
    if (
      loginUser &&
      loginUser.user &&
      loginUser.user.id &&
      loginUser.id !== "guest"
    ) {
      this.setState({ isGuest: false });
      axios
        .get(env.apiEndPoint + "/users/" + loginUser.user.id, { headers })
        .then((response) => {
          const player = response.data;
          this.setState({
            id: player.id,
            name: player.username,
            n5Score: player.current_n5_score,
            n4Score: player.current_n4_score,
            examRecord: player.exam_scores,
            practiseRecord: player.practise_scores,
            image: player.profile
              ? env.apiEndPoint + player.profile.url
              : playerProfile,
          });
          if (this.state.examRecord && this.state.examRecord.length > 0) {
            examN5 = this.state.examRecord.filter((e) => e.level === "N5");
            examN5 = this.sortedByDate(examN5);
            examN4 = this.state.examRecord.filter((e) => e.level === "N4");
            examN4 = this.sortedByDate(examN4);
          }
          if (
            this.state.practiseRecord &&
            this.state.practiseRecord.length > 0
          ) {
            practiseN5 = this.state.practiseRecord.filter(
              (e) => e.level === "N5"
            );
            practiseN5 = this.chapterToList(practiseN5);
            practiseN5 = this.sortedByDate(practiseN5);
            practiseN4 = this.state.practiseRecord.filter(
              (e) => e.level === "N4"
            );
            practiseN4 = this.chapterToList(practiseN4);
            practiseN4 = this.sortedByDate(practiseN4);
          }
          this.setState({
            examRecordN5: examN5,
            examRecordN4: examN4,
            practiseRecordN5: practiseN5,
            practiseRecordN4: practiseN4,
          });
        })
        .catch((err) => {
          if (err.response) {
            console.error("Error in setState : ", err.response);
            const errorDict = err.response;
            this.setState({
              isError: true,
              errorMessage: errorDict.statusText,
              errorStatus: errorDict.status,
            });
          }
        });
    }
  }
  sortedByDate(items = []) {
    const data = items.sort((a, b) => {
      const aTime = new Date(a.answer_date).getTime();
      const bTime = new Date(b.answer_date).getTime();
      if (aTime < bTime) {
        return 1;
      }
      if (aTime > bTime) {
        return -1;
      }
      return 0;
    });
    return data;
  }
  chapterToList(practiseItems) {
    _.map(practiseItems, (practise) => {
      practise.chapters = practise.chapters ? practise.chapters.split(",") : [];
    });
    return practiseItems;
  }
  handleOnChange(event) {
    this.setState({
      [event.target.name]: event.target.value,
    });
    if(this.state.name !== event.target.value){
      this.setState({ change: true});
    } else {
      this.setState({ change: false });
    }
  }
  fileImageChange(files) {
    console.log(files)
    const reader = new FileReader();
    reader.onload = () => {
      this.setState({
        image: reader.result,
        profilePicture: files[0],
      });
    };
    reader.onerror = () => {
      console.error(reader.error);
    };
    console.log(files)
    reader.readAsDataURL(files[0]);
    this.setState({ change: true})
  }

  updateProfile(data, id) {
    this.setState({ open: true , pending: true});
    const loginUser = JSON.parse(localStorage.getItem("loginUser"));
    let jwt = loginUser && loginUser.jwt ? loginUser.jwt : "";
    const headers = { Authorization: `Bearer ${jwt}` };
    console.log(data)
    if (!this.state.isGuest) {
      axios
        .put(env.apiEndPoint + "/users/" + id, data, { headers })
        .then((data) => {
          console.log(data)
          //  localStorage.setItem('loginUser', data)
          this.setState({ success: true , pending: false, change: false});
        })
        .catch((err) => {
          if (err.response) {
            console.error("Error in setState : ", err.response);
            const errorDict = err.response;
            this.setState({
              isError: true,
              errorMessage: errorDict.statusText,
              errorStatus: errorDict.status,
            });
          }
        });
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    const user = _.cloneDeep(this.state);
    const userId = this.state.id;
    let data = {};
    if (user.name) {
      data.username = user.name;
    }
    console.log(user.profilePicture)
    if (user.profilePicture && user.profilePicture instanceof File) {
      console.log('here')
      const body = new FormData();
      body.append("data", JSON.stringify(data));
      body.append("files.profile", user.profilePicture);
      JSON.stringify(body);
      const param = new FormData();
      param.append('files', user.profilePicture);
      const imagedata = () => {
        return new Promise((imgresolve) => {
          axios
          .post(env.apiEndPoint + "/upload" , param)
          .then((data) => {imgresolve(data)})
          .catch((err) => {
            if (err.response) {
              console.error("Error in setState : ", err.response);
              const errorDict = err.response;
              this.setState({
                isError: true,
                errorMessage: errorDict.statusText,
                errorStatus: errorDict.status,
              });
            }
          });
        });
      };
      const imagedatas = await imagedata();
      if(imagedatas && imagedatas.data) {
        data.profile = imagedatas.data[0];
      }
      this.updateProfile(data, userId)
      
    } else {
      this.updateProfile(data, userId)
    }
  }

  errorDialogClose(close) {
    this.setState({
      isError: close,
      errorMessage: "",
      errorStatus: 0,
    });
  }

  handleClose = () => {
    this.setState({ open: false , pending: false});
  };

  render() {
    let alertTitle;
    if (this.state.pending) {
      alertTitle = "Profile updating...";
    } else if (this.state.success) {
      alertTitle = "Update Sucess!";
    } else {
      alertTitle = "Update Failed! Please Try again...";
    }
    return (
      <>
        {!this.state.isGuest ? (
          <div className="profile">
            <div className="profile-container">
              <div className="user-image">
                <div className="profile-image">
                  <div
                    className="image"
                    style={{
                      backgroundImage: `url(${this.state.image})`,
                    }}
                  ></div>
                </div>
                <button
                  className="img-change-btn"
                  onClick={() => this.fileChooser.click()}
                >
                  <i className="fa fa-camera camera"></i>
                </button>
              </div>
              <input
                type="file"
                ref={(ref) => (this.fileChooser = ref)}
                className="file-chooser"
                accept="image/*"
                onChange={(e) => this.fileImageChange(e.target.files)}
              ></input>
              <div className="user-profile-info">
                <form onSubmit={this.handleSubmit}>
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-field"
                    value={this.state.name}
                    onChange={this.handleOnChange}
                  ></input>
                  {/* <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="form-field"
                    value={this.state.password}
                    onChange={this.handleOnChange}></input> */}

                  <label className="form-label">Current N5 Score</label>
                  <input
                    type="text"
                    name="n5"
                    className="form-field"
                    value={this.state.n5Score}
                    disabled
                  ></input>
                  <label className="form-label">Current N4 Score</label>
                  <input
                    type="text"
                    name="n4"
                    className="form-field"
                    value={this.state.n4Score}
                    disabled
                  ></input>
                  <div className="form-btn">
                    <button type="submit" disabled={!this.state.change} className="btn-save">
                      save
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <Dialog
              open={this.state.open}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
              style={{ color: "red" }}
            >
              <DialogContent
                style={{
                  width: "230px",
                  height: "35px",
                  color: "black",
                  padding: "15px 10px -5px 10px",
                }}
              >
                <DialogContentText
                  style={{
                    color: "black",
                    fontSize: "14px",
                  }}
                  id="alert-dialog-description"
                >
                  {alertTitle}
                </DialogContentText>
              </DialogContent>
              {!this.state.pending && (
                <DialogActions
                  style={{
                    padding: "0",
                  }}
                >
                <Button onClick={this.handleClose} color="primary" autoFocus>
                  OK
                </Button>
                </DialogActions>
              )}
            </Dialog>
            <div className="record">
              <div className="record-container">
                {this.state.examRecordN5.length > 0 && (
                  <div className="record-sub-container">
                    <h2>Exam result of N5</h2>
                    <ScoreResult
                      level="N5"
                      mode="exam"
                      data={this.state.examRecordN5}
                    ></ScoreResult>
                  </div>
                )}
              </div>
              <div className="record-container">
                {this.state.examRecordN4.length > 0 && (
                  <div className="record-sub-container">
                    <h2>Exam result of N4</h2>
                    <ScoreResult
                      level="N4"
                      mode="exam"
                      data={this.state.examRecordN4}
                    ></ScoreResult>
                  </div>
                )}
              </div>
              <div className="record-container">
                {this.state.practiseRecordN5.length > 0 && (
                  <div className="record-sub-container">
                    <h2>Practise result of N5</h2>
                    <ScoreResult
                      level="N5"
                      mode="practise"
                      data={this.state.practiseRecordN5}
                    ></ScoreResult>
                  </div>
                )}
              </div>
              <div className="record-container">
                {this.state.practiseRecordN4.length > 0 && (
                  <div className="record-sub-container">
                    <h2>Practise result of N4</h2>
                    <ScoreResult
                      level="N4"
                      mode="practise"
                      data={this.state.practiseRecordN4}
                    ></ScoreResult>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p>Guest doesn't have profile</p>
        )}
        {this.state.isError && (
          <ErrorHandleDialog
            message={this.state.errorMessage}
            status={this.state.errorStatus}
            open={this.state.isError}
            close={this.errorDialogClose}
          />
        )}
      </>
    );
  }
}

export default Profile;
