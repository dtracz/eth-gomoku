import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {StartService} from '../../../services/start.service';
import {Router} from '@angular/router';
import {FieldColour} from '../../../utils/field-colour';
import {GameService} from '../../../services/game.service';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['../common.css', './start.component.css']
})
export class StartComponent implements OnInit {

  playerName: string;
  formSubmitted = false;
  form: FormGroup;
  validationMessages = [
    {type: 'required', message: 'Player name is required.'},
    {type: 'minLength', message: 'Player name cannot be empty.'}
  ];

  constructor(private fb: FormBuilder,
              private startService: StartService,
              private gameService: GameService,
              private router: Router) {
  }

  ngOnInit(): void {
    this.createForms();
  }

  private createForms(): void {
    this.form = this.fb.group({
      playerName: new FormControl(this.playerName, Validators.compose([Validators.required, Validators.minLength(1)]))
    });
  }

  submitForm(): void {
    if (this.form.invalid) {
      alert('Invalid form');
      this.formSubmitted = true;
    } else {
      const playerName = this.form.value.playerName;

      this.startService.startGame(playerName).then(status => {
        this.gameService.gameAddress = status.receipt.to;
      }).catch(err => alert(err));

      this.gameService.playerColour = FieldColour.White;
      this.gameService.playerName = playerName;
      this.gameService.moveIdx = 1;
      this.gameService.turn = true;
      this.gameService.gameInit = true;

      this.router.navigate(['/game'])
        .catch(err => alert(err));
    }
  }
}
