import { Component, Renderer, ElementRef, ViewChild } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';

import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
})

export class AppComponent {
  @ViewChild('fileUpload') fileUpload: ElementRef;
  @ViewChild('searchUpload') searchUpload: ElementRef;

  name = 'Perseus'
  images: String[] = []
  status: String = ""
  searchTerm = ""

  constructor(private http: Http) {
    this.getPhotos()
  }

  public uploadPhotos() {
    this.fileUpload.nativeElement.click()
  }

  public searchPhoto() {
    this.searchUpload.nativeElement.click()
  }

  public searchText() {
    if (this.searchTerm) {
      this.http.get("/photos/searchText?query=" + this.searchTerm).toPromise().then(response => {
        this.images = response.json().items as String[]
      });
    }
  }

  uploadChange(event: any) {
    let fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      let formData: FormData = new FormData();

      for (var i = 0; i < fileList.length; i++) {
        formData.append("photos", fileList[i], fileList[i].name);
      }

      this.status = "Uploading files for analysis..."

      this.http.post("/photos/upload", formData).toPromise().then(response => {
        this.status = ""
        this.getPhotos()
      }).catch(error => {
        this.status = "Failed to upload files"
      });
    }
  }

  searchChange(event: any) {
    let fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      let formData: FormData = new FormData();
      formData.append("photo", fileList[0], fileList[0].name);

      this.status = "Findind similar photos..."

      this.http.post("/photos/search", formData).toPromise().then(response => {
        this.status = ""
        this.images = response.json().items as String[]
      }).catch(error => {
        this.status = "Failed to upload files"
      });
    }
  }

  public openPhoto(url: string) {
    var win = window.open(url, '_blank');
    win.focus();
  }

  public getPhotos() {
    const url = "/photos";

    this.http.get(url).toPromise().then(response => {
      this.images = response.json().images as String[]
    })
  }
}
