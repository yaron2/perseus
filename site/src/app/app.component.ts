import { Component, Renderer, ElementRef, ViewChild } from '@angular/core'
import { Headers, Http, RequestOptions } from '@angular/http'

import 'rxjs/add/operator/toPromise'

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
})

export class AppComponent {
  @ViewChild('fileUpload') fileUpload: ElementRef
  @ViewChild('searchUpload') searchUpload: ElementRef

  name = 'Perseus'
  images: SearchResult[] = []
  status: String = ""
  searchTerm = ""

  apiAddress: String = ""

  constructor(private http: Http) {
    this.getPhotos()
  }

  public uploadPhotos() {
    this.fileUpload.nativeElement.click()
  }

  public searchPhoto() {
    this.searchUpload.nativeElement.click()
  }

  public deleteAll() {
    this.status = "Deleting images..."
    const url = this.apiAddress + "/photos"

    this.http.delete(url).toPromise().then(response => {
      if (response.json().status == "ok") {
        this.getPhotos()
        this.status = ""
      }
      else
        this.status = "Failed deleting photos"
    })
  }

  public searchText() {
    if (this.searchTerm) {
      this.http.get(this.apiAddress + "/photos/searchText?query=" + this.searchTerm).toPromise().then(response => {
        this.extractData(response.json().items)
      })
    }
  }

  public showMetadata(image: SearchResult, event) {
    event.stopPropagation()
    image.showOrHideMetadata()
  }

  uploadChange(event: any) {
    let fileList: FileList = event.target.files
    if (fileList.length > 0) {
      let formData: FormData = new FormData()

      for (var i = 0; i < fileList.length; i++) {
        formData.append("photos", fileList[i], fileList[i].name)
      }

      this.status = "Uploading files for analysis..."

      this.http.post(this.apiAddress + "/photos/upload", formData).toPromise().then(response => {
        this.status = ""
        
        setTimeout(() => {
          this.getPhotos()
        }, 2500);
      }).catch(error => {
        this.status = "Failed to upload files"
      });
    }
  }

  searchChange(event: any) {
    let fileList: FileList = event.target.files
    if (fileList.length > 0) {
      let formData: FormData = new FormData()
      formData.append("photo", fileList[0], fileList[0].name)

      this.status = "Findind similar photos..."

      this.http.post(this.apiAddress + "/photos/search", formData).toPromise().then(response => {
        this.status = ""
        this.extractData(response.json().items)
      }).catch(error => {
        this.status = "Failed to upload files"
      })
    }
  }

  public openPhoto(url: string) {
    var win = window.open(url, '_blank')
    win.focus()
  }

  private extractData(items: any) {
    this.images = []

    for (let item of items) {
      this.images.push(new SearchResult(item.url, item.score, item.tags, item.captions, item.categories, false))
    }
  }

  public getPhotos() {
    const url = this.apiAddress + "/photos"

    this.http.get(url).toPromise().then(response => {
      this.extractData(response.json().items)
    })
  }
}

class SearchResult {
  constructor(public url: String, public score: Number, public tags: String[], public captions: String[], public categories: String[], public showingMetadata: Boolean) { }

  public showMetadataText = "Show Metadata"

  public metadata = "Captions: " + this.captions + " " + "Categories: " + this.categories + " " + "Tags: " + this.tags

  public showOrHideMetadata() {
    this.showingMetadata = !this.showingMetadata
    if (this.showingMetadata)
      this.showMetadataText = "Hide Metadata"
    else
      this.showMetadataText = "Show Metadata"
  }
}
