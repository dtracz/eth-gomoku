import {Component, OnInit} from '@angular/core';
import {JoinService} from "../../../services/join.service";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";

@Component({
  selector: 'app-join',
  templateUrl: './join.component.html',
  styleUrls: ['../common.css', './join.component.css']
})
export class JoinComponent implements OnInit {

  playerName: string;
  gameAddress: string;
  form: FormGroup;
  validationMessages = {
    playerName: [
      {type: 'required', message: "Player name is required."},
      {type: 'minLength', message: "Player name cannot be empty."}
    ],
    gameAddress: [{type: 'required', message: "Game address is required."}]
  };

  constructor(private fb: FormBuilder, private joinService: JoinService, private router: Router) {
  }

  ngOnInit(): void {
    this.createForms();
  }

  private createForms() {
    this.form = this.fb.group({
      playerName: new FormControl(this.playerName, Validators.compose([Validators.required, Validators.minLength(1)])),
      gameAddress: new FormControl(this.gameAddress, Validators.compose([Validators.required]))
    });
  }

  submitForm() {
    if (this.form.invalid) {
      alert("INVALID FORM");
    } else {
      console.log(this.form.value);
      //this.joinService.startGame(this.form.value);
    }
  }
}
