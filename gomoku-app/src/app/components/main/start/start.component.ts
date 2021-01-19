import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {StartService} from "../../../services/start.service";
import {Router} from "@angular/router";
import {FieldState, GameEthereumService} from "../../../services/game.ethereum.service";

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['../common.css', './start.component.css']
})
export class StartComponent implements OnInit {

  playerName: string;
  formSubmitted: boolean = false;
  form: FormGroup;
  validationMessages = [
    {type: 'required', message: "Player name is required."},
    {type: 'minLength', message: "Player name cannot be empty."}
  ];

  constructor(private fb: FormBuilder, private startService: StartService, private gameEthereumService: GameEthereumService, private router: Router) {
  }

  ngOnInit(): void {
    this.createForms();
  }

  private createForms() {
    this.form = this.fb.group({
      playerName: new FormControl(this.playerName, Validators.compose([Validators.required, Validators.minLength(1)]))
    });
  }

  submitForm() {
    if (this.form.invalid) {
      alert("INVALID FORM");
    } else {
      const playerName = this.form.value.playerName;
      this.startService.startGame(playerName);
      this.gameEthereumService.playerColour = FieldState.White;
      this.gameEthereumService.playerName = playerName;
      this.router.navigate(['/game']);
    }
  }
}
