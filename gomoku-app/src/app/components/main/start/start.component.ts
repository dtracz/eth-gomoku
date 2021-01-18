import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {StartService} from "../../../services/start.service";

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['../common.css', './start.component.css']
})
export class StartComponent implements OnInit {

  playerName: string;
  formSubmitted: boolean = false;
  userForm: FormGroup;
  validationMessages = [
    {type: 'required', message: "Player name is required."}
  ];

  constructor(private fb: FormBuilder, private startService: StartService) {
  }

  ngOnInit(): void {
    this.createForms();
  }

  private createForms() {
    this.userForm = this.fb.group({
      playerName: new FormControl(this.playerName, Validators.required)
    });
  }

  submitForm() {
    if (this.userForm.invalid) {
      alert("INVALID FORM");
    } else {
      console.log(this.userForm.value);
      this.startService.startGame(this.userForm.value);
    }
  }

}
