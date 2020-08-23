import React from 'react';
import AOS from 'aos';
import axios from 'axios';
import { Card, CardActionArea, CardContent, Typography, CardActions, Button, TextField, Chip, Snackbar, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import MuiAlert from '@material-ui/lab/Alert';

import 'aos/dist/aos.css';
import 'bootstrap-4-grid/css/grid.min.css';

import './App.css';

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const API_URL = "http://localhost:8000"

class App extends React.Component {

  state = {
    tags: [],
    name: "",
    url: "",
    desc: "",
    newTags: [],
    nameError: false,
    urlError: false,
    descError: false,
    nameErrorText: "",
    urlErrorText: "",
    descErrorText: "",
    bookmarks: null,
    snackbarStatus: false,
    snackbarSeverity: "",
    snackbarMessage: "",
    submitBtn: false,
    search: "",
    filterTags: "",
    filterTagsArray: [],
    deleteConfirmation: false,
    deleteId: "",
    editDialog: false,
    editName: "",
    editUrl: "",
    editDesc: "",
    editTags: [],
    editId: ""
  }

  componentDidMount(){
    this.getTags();
    this.getBookmark();
    AOS.init();
  }

  getBookmark(id = null){
    if (id === null){
      axios({
        method: "get",
        url: API_URL+"/bookmark",
      }).then(({data}) => {
        if (data.status === "success"){
          this.setState({ bookmarks: data.result, search: "", filterTags: "", filterTagsArray: [] });
        }
        else {
          this.setState({ bookmarks: [] });
        }
      }).catch((err) => {
        this.setState({ bookmarks: "error" });
      });
    }
    else {
      this.setState({ snackbarMessage: "Opening Bookmark...", snackbarStatus: true, snackbarSeverity: "info" });
      axios({
        method: "get",
        url: API_URL+"/bookmark/"+id,
      }).then(({data}) => {
        if (data.status === "success"){
          let newJson = data.result[0].tags.replace(/([a-zA-Z0-9]+?):/g, '"$1":');
          newJson = newJson.replace(/'/g, '"');
          let json = JSON.parse(newJson);
          setTimeout(() => {
            this.setState({ snackbarStatus: false, editDialog: true, editName: data.result[0].name, editUrl: data.result[0].url, editDesc: data.result[0].desc, editTags: json, editId: data.result[0].id });
          }, 2000);
        }
        else {
          this.setState({ snackbarMessage: "Unexpected Error Occur,", snackbarStatus: true, snackbarSeverity: "error" });
        }
      }).catch((err) => {
        this.setState({ snackbarMessage: "Unexpected Error Occur,", snackbarStatus: true, snackbarSeverity: "error" });
      });
    }
  }

  handleDelete(){
    this.setState({ snackbarMessage: "Deleting Bookmark...", snackbarStatus: true, snackbarSeverity: "info", deleteConfirmation: false });
    const { deleteId } = this.state;
    axios({
      method: "delete",
      url: API_URL+"/bookmark/"+deleteId,
    }).then(({data}) => {
      if (data.status === "success"){
        setTimeout(() => {
          this.setState({ snackbarMessage: "Deleted Successfully", snackbarStatus: true, snackbarSeverity: "success" });
          this.getTags();
          this.getBookmark();
        }, 2000);
      }
      else {
        setTimeout(() => {
          this.setState({ snackbarMessage: "Unexpected Error Occur,", snackbarStatus: true, snackbarSeverity: "error" });
          this.getTags();
          this.getBookmark();
        }, 2000);
      }
    }).catch((err) => {
      setTimeout(() => {
        this.setState({ snackbarMessage: "Unexpected Error Occur,", snackbarStatus: true, snackbarSeverity: "error" });
        this.getTags();
        this.getBookmark();
      }, 2000)
    });
  }

  handleSearch(data){
    const { filterTags } = this.state;
    this.setState({ search: data });
    let query = "?search="+data;
    if (filterTags !== ""){
      query = query+"&tags="+filterTags
    }
    axios({
      method: "get",
      url: API_URL+"/bookmark"+query,
    }).then(({data}) => {
      if (data.status === "success"){
        this.setState({ bookmarks: data.result });
      }
      else {
        this.setState({ bookmarks: [] });
      }
    }).catch((err) => {
      this.setState({ bookmarks: "error" });
    });
  }

  handleFilter(data){
    let loop = 0;
    let tags = "";
    data.map((tag) => {
      loop++;
      if (loop === data.length){
        tags = tags+tag.name;
      }
      else {
        tags = tags+tag.name+",";
      }
      return "";
    });
    const { search } = this.state;
    let query = "?tags="+tags;
    if (search !== ""){
      query = query+"&search="+search
    }
    this.setState({ filterTags: tags, filterTagsArray: data });
    axios({
      method: "get",
      url: API_URL+"/bookmark"+query,
    }).then(({data}) => {
      if (data.status === "success"){
        this.setState({ bookmarks: data.result });
      }
      else {
        this.setState({ bookmarks: [] });
      }
    }).catch((err) => {
      this.setState({ bookmarks: "error" });
    });
  }

  handleEdit(){
    const { editId, editName, editDesc, editTags, editUrl } = this.state;
    if ((editName !== "")&&(editUrl !== "")&&(editDesc !== "")){
      if (this.isUrl(editUrl)){
        this.setState({ updatingProcess: (<Alert severity="info" className="my-2">Updating Bookmark...</Alert>) });
        axios({
          method: "put",
          url: API_URL+"/bookmark/"+editId,
          data: {
            name: editName,
            url: editUrl,
            desc: editDesc,
            tags: editTags
          }
        }).then(({data}) => {
          if (data.status === "success"){
            setTimeout(() => {
              this.setState({ updatingProcess: (<Alert severity="success" className="my-2">Bookmark Updated.</Alert>) });
              this.getBookmark();
              this.getTags();
              setTimeout(() => {
                this.setState({ updatingProcess: "" });
              }, 2000)
            }, 2000)
          }
        }).catch((err) => {
          console.log(err)
        });
      }
      else {
        let urlError = true;
        let urlErrorText = "Invalid URL.";
        this.setState({ urlError: urlError, urlErrorText: urlErrorText });
      }
    }
    else {
      let nameError = false, nameErrorText = "", urlError = false, urlErrorText = "", descError = false, descErrorText = "";
      if (editName === ""){
        nameError = true;
        nameErrorText = "Required Field.";
      }
      if (editUrl === ""){
        urlError = true;
        urlErrorText = "Required Field.";
      }
      if (editDesc === ""){
        descError = true;
        descErrorText = "Required Field.";
      }
      this.setState({ nameError: nameError, urlError: urlError, descError: descError, nameErrorText: nameErrorText, urlErrorText: urlErrorText, descErrorText: descErrorText});
    }
  }

  isUrl(s) {
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(s);
  }

  saveBookmark(){
    const { name, url, desc, newTags } = this.state;
    if ((name !== "")&&(url !== "")&&(desc !== "")){
      if (this.isUrl(url)){
        this.setState({ submitBtn: true, snackbarMessage: "Saving Bookmark...", snackbarStatus: true, snackbarSeverity: "info" });
        axios({
          method: "post",
          url: API_URL+"/bookmark",
          data: {
            name: name,
            url: url,
            desc: desc,
            tags: newTags
          }
        }).then(({data}) => {
          if (data.status === "success"){
            setTimeout(() => {
              this.setState({ submitBtn: false, snackbarMessage: "Bookmark already Saved.", snackbarStatus: true, snackbarSeverity: "success", name: "", url: "", desc: "", newTags: "" });
              this.getBookmark();
              this.getTags();
            })
          }
        }).catch((err) => {
          console.log(err)
        });
      }
      else {
        let urlError = true;
        let urlErrorText = "Invalid URL.";
        this.setState({ urlError: urlError, urlErrorText: urlErrorText });
      }
    }
    else {
      let nameError = false, nameErrorText = "", urlError = false, urlErrorText = "", descError = false, descErrorText = "";
      if (name === ""){
        nameError = true;
        nameErrorText = "Required Field.";
      }
      if (url === ""){
        urlError = true;
        urlErrorText = "Required Field.";
      }
      if (desc === ""){
        descError = true;
        descErrorText = "Required Field.";
      }
      this.setState({ nameError: nameError, urlError: urlError, descError: descError, nameErrorText: nameErrorText, urlErrorText: urlErrorText, descErrorText: descErrorText});
    }
  }

  getTags(){
    axios({
      method: "get",
      url: API_URL+"/tag",
    }).then(({ data }) => {
      if (data.status === "success"){
        this.setState({ tags: data.result });
      }
    }).catch((err) => {
      console.log(err);
    });
  }

  renderBookmarkCards(props){
    let renderTags = []
    let newJson = props.bmTags.replace(/([a-zA-Z0-9]+?):/g, '"$1":');
    newJson = newJson.replace(/'/g, '"');
    let json = JSON.parse(newJson);
    if (json.length > 0){
      json.map((tag) => {
        renderTags.push(
          <div className="mr-2 mt-2">
            <Chip label={tag}/>
          </div>
        )
      });
    }
    else {
      renderTags = "";
    }
    return(
      <div className="col-sm-4 mt-2">
        <Card>
          <CardActionArea onClick={() => window.open(props.bmUrl,"_blank") }>
            <CardContent>
              <Typography gutterBottom variant="h5" component="h2">
                {props.bmName}
              </Typography>
              <Typography variant="body2" color="textSecondary" component="p">
                {props.bmDesc}
              </Typography>
              <p style={{ padding: 0, margin: 0 }} className="py-2">
                {props.bmUrl}
              </p>
              <div className="d-flex flex-row flex-wrap">
                {renderTags}
              </div>
            </CardContent>
          </CardActionArea>
          <CardActions>
            <Button size="small" color="primary" onClick={() => props.component.getBookmark(props.bmId)}>
              Edit
            </Button>
            <Button size="small" color="secondary" onClick={() => props.component.setState({ deleteConfirmation: true, deleteId: props.bmId })}>
              Delete
            </Button>
          </CardActions>
        </Card>
      </div>
    );
  }

  render() {
    const { tags, bookmarks, nameError, urlError, descError, nameErrorText, urlErrorText, descErrorText, snackbarStatus, snackbarSeverity, snackbarMessage, submitBtn, name, url, desc, newTags, deleteConfirmation, editDialog, editName, editDesc, editUrl, editTags, updatingProcess, filterTagsArray, search } = this.state;
    let renderBookmarks;
    if (bookmarks !== null){
      if (bookmarks.length > 0){
        renderBookmarks = [];
        bookmarks.map((bookmark, key) => {
          renderBookmarks.push(
            <this.renderBookmarkCards bmId={bookmark.id} bmName={bookmark.name} bmUrl={bookmark.url} bmDesc={bookmark.desc} bmTags={bookmark.tags} component={this} key={key}/>
          );
          return "";
        })
      }
      else {
        renderBookmarks = (
          <div className="col-sm-12 py-5">
            <center>No Bookmarks Available.</center>
          </div>
        );
      }
    }
    else {
      if (bookmarks === null){
        renderBookmarks = (
          <div className="col-sm-12 py-5">
            <center><CircularProgress /></center>
          </div>
        );
      }
      else {
        renderBookmarks = (
          <div className="col-sm-12 py-5">
            <center>Unexpected Error Occured.</center>
          </div>
        );
      }
    }
    return(
      <div className="container-fluid pb-5">
        <div className="container">
          <div className="row py-4">
            <div className="col-sm-12">
              <center><span style={{ fontWeight: "bold", fontSize: 36, color: "#2d3436" }}>Bookmark Manager</span></center>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-8" style={{ overflowY: "scroll", height: "90vh" }}>
              <div className="row">
                {renderBookmarks}
              </div>
            </div>
            <div className="col-sm-4 order-first">
              <div className="row mt-2" style={{ background: "white", padding: 10, borderRadius: 5 }}>
                <div className="col-sm-12 mt-2">
                  <TextField label="Search" value={search} variant="outlined" fullWidth onChange={(data) => this.handleSearch(data.target.value) }/>
                </div>
                <div className="col-sm-12 mt-3">
                  <Autocomplete
                    multiple
                    options={tags}
                    value={filterTagsArray}
                    onChange={(event, newValue) => this.handleFilter(newValue) }
                    getOptionLabel={(option) => option.name}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label="Filter Tags"
                        placeholder="Tags"
                      />
                    )}
                  />
                </div>
                <div className="col-sm-12 mt-2">
                  <hr/>
                </div>
                <div className="col-sm-12 mt-2">
                  <p style={{ padding: 0, margin: 0, fontWeight: "bold", fontSize: 28 }}>Add Bookmark</p>
                </div>
                <div className="col-sm-12 mt-3">
                  <TextField label="Name" variant="outlined" value={name} fullWidth onChange={(data) => this.setState({ nameError: false, nameErrorText: "", name: data.target.value })} error={nameError} helperText={nameErrorText}/>
                </div>
                <div className="col-sm-12 mt-3">
                  <TextField label="URL" variant="outlined" value={url} fullWidth onChange={(data) => this.setState({ urlError: false, urlErrorText: "", url: data.target.value })} error={urlError} helperText={urlErrorText}/>
                </div>
                <div className="col-sm-12 mt-3">
                  <TextField label="Description" variant="outlined" value={desc} fullWidth onChange={(data) => this.setState({ descError: false, descErrorText: "", desc: data.target.value })} error={descError} helperText={descErrorText}/>
                </div>
                <div className="col-sm-12 mt-3">
                  <Autocomplete
                    multiple
                    freeSolo
                    value={newTags}
                    onChange={(event, newValue) => this.setState({ newTags: newValue })}
                    options={tags.map((option) => option.name)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip label={option} {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                    <TextField {...params} variant="outlined" label="Add Tags" placeholder="Tags" />
                    )}
                  />
                </div>
                <div className="col-sm-12 mt-3 mb-2">
                  <Button variant="contained" fullWidth color="primary" onClick={() => this.saveBookmark()} disabled={submitBtn}>Submit</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Snackbar open={snackbarStatus} autoHideDuration={6000} onClose={() => this.setState({ snackbarStatus: false })}>
          <Alert onClose={() => this.setState({ snackbarStatus: false })} severity={snackbarSeverity}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
        <Dialog
          open={deleteConfirmation}
        >
          <DialogTitle>{"Delete Bookmark?"}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will delete your bookmark. Deleted Bookmark cannot be Recovered.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.setState({ deleteConfirmation: false })} color="primary">
              Cancel
            </Button>
            <Button onClick={() => this.handleDelete() } color="Secondary">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={editDialog}>
          <DialogTitle onClose={() => this.setState({ editDialog: false })}>
            Edit Bookmark
          </DialogTitle>
          <DialogContent dividers>
            <div className="row">
              <div className="col-sm-12 mt-3">
                <TextField label="Name" variant="outlined" value={editName} fullWidth onChange={(data) => this.setState({ nameError: false, nameErrorText: "", editName: data.target.value })} error={nameError} helperText={nameErrorText}/>
              </div>
              <div className="col-sm-12 mt-3">
                <TextField label="URL" variant="outlined" value={editUrl} fullWidth onChange={(data) => this.setState({ urlError: false, urlErrorText: "", editUrl: data.target.value })} error={urlError} helperText={urlErrorText}/>
              </div>
              <div className="col-sm-12 mt-3">
                <TextField label="Description" variant="outlined" value={editDesc} fullWidth onChange={(data) => this.setState({ descError: false, descErrorText: "", editDesc: data.target.value })} error={descError} helperText={descErrorText}/>
              </div>
              <div className="col-sm-12 mt-3">
                <Autocomplete
                  multiple
                  freeSolo
                  value={editTags}
                  onChange={(event, newValue) => this.setState({ editTags: newValue })}
                  options={tags.map((option) => option.name)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip label={option} {...getTagProps({ index })} />
                    ))
                  }
                  renderInput={(params) => (
                  <TextField {...params} variant="outlined" label="Add Tags" placeholder="Tags" />
                  )}
                />
              </div>
            </div>
            {updatingProcess}
          </DialogContent>
          <DialogActions>
            <Button autoFocus onClick={() => this.setState({ editDialog: false })} color="primary">
              Close
            </Button>
            <Button autoFocus onClick={() => this.handleEdit() } color="primary">
              Save changes
            </Button>
          </DialogActions>
      </Dialog>
      </div>
    )
  }
}

export default App;

