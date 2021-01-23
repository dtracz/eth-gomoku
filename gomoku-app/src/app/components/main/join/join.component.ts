import {Component, OnInit} from '@angular/core';
import {JoinService} from "../../../services/join.service";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {FieldState, GameEthereumService} from "../../../services/game.ethereum.service";

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

  constructor(private fb: FormBuilder, private joinService: JoinService, private gameEthereumService: GameEthereumService, private router: Router) {
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
      const playerName = this.form.value.playerName;
      this.joinService.joinGame(playerName).then();
      this.gameEthereumService.playerColour = FieldState.Black;
      this.gameEthereumService.playerName = playerName;
      //this.gameEthereumService.gameAddress = gameAddress;
      this.router.navigate(['/game'])
    }
  }
}
