import {Component, OnInit} from '@angular/core';
import {JoinService} from '../../../services/join.service';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {FieldColour} from '../../../utils/field-colour';
import {GameService} from '../../../services/game.service';

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
      {type: 'required', message: 'Player name is required.'},
      {type: 'minLength', message: 'Player name cannot be empty.'}
    ]
  };

  constructor(private fb: FormBuilder,
              private joinService: JoinService,
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
    } else {
      const playerName = this.form.value.playerName;
      this.joinService.joinGame(playerName).then(status => {
        this.gameService.gameAddress = status.receipt.to;
      }).catch(err => alert(err));

      this.gameService.playerColour = FieldColour.Black;
      this.gameService.playerName = playerName;
      this.gameService.moveIdx = 2;
      this.gameService.turn = false;
      this.gameService.gameInit = true;
      this.gameService.sendLoaded();

      this.router.navigate(['/game'])
        .catch(err => alert(err));
    }
  }
}
