angular.module('app.ctrl.Minesweeper', [
])
.controller('app.ctrl.Minesweeper', function($scope, $timeout, Game, Grid) {
    var game;
    function start_game() {
        game                 = Game($timeout, { grid_rows: 9, grid_cols: 9, mines_count: 10 });
        $scope.game          = game;
        $scope.grid          = game.grid.grid;
        $scope.on_cell_click = game.grid.on_cell_click;
    }
    start_game();

    $scope.restart_game = function() {
        game.over.value = true;
        start_game();
    };
})
.factory('Game', function($timeout, Grid) {
    return function(args) {
        var grid_rows   = args.grid_rows   ||  9;
        var grid_cols   = args.grid_cols   ||  9;
        var mines_count = args.mines_count || 10;
        var time        = 0;
        var over        = { value: false };
        var win         = { value: false };
        var lose        = { value: false };

        var grid = Grid({
            game: { over: over },

            rows: grid_rows, cols: grid_cols, mines_count: mines_count,

            on_player_win:  player_wins,
            on_player_lose: player_loses,
        });

        function tick() {
            if (!over.value) {
                time++;
                $timeout(tick, 1000);
            }
        }
        $timeout(tick, 1000);
        function get_time() { return time; }

        function player_wins() {
            over.value = true;
            win.value = true;
            console.log('win');
            grid.reveal_mines();
        };

        function player_loses() {
            over.value = true;
            lose.value = true;
            console.log('lose');
            grid.reveal_mines();
        };

        return {
            grid:        grid,
            over:        over,
            win:         win,
            lose:        lose,
            mines_count: mines_count,
            get_time:    get_time,

            sixth_sense: false,
        };
    };
})
.factory('Grid', function(Cell) {
    return function(args) {
        var game           = args.game;
        var rows           = args.rows;
        var cols           = args.cols;
        var mines_count    = args.mines_count;
        var on_player_win  = args.on_player_win;
        var on_player_lose = args.on_player_lose;
        var grid;
        var mines_positions;
        var already_visited_cells = [];

        function create_grid() {
            grid = _.range(1, 1+rows).map(function(row) {
                return _.range(1, 1+cols).map(function(col) {
//                    return [row - 1, col - 1];
                    return Cell({ has_mine: false });
                });
            });
//            console.log(grid);
        }
        create_grid();

        function burrow_mines() {
            var mc = mines_count;
            mines_positions = [];
            while (mc > 0) {
                var new_mine_row = rand(0, rows - 1);
                var new_mine_col = rand(0, cols - 1);

                if (!grid[new_mine_row][new_mine_col].has_mine) {
                    mines_positions.push( [ new_mine_row, new_mine_col ] );
                    grid[new_mine_row][new_mine_col].has_mine = true;
                    mc -= 1;
                }
            }
        };
        burrow_mines();
//        console.log(mines_positions);

        function on_cell_click(row, col, cell) {
//            console.log(row, col, cell);
            if (game.over.value || cell.was_clicked) { return; }

            if (cell.has_mine) {
                cell.was_clicked = true;
                on_player_lose();
                return
            }

            visit_neighbouring_cells(row, col, cell, already_visited_cells);
//            console.log(already_visited_cells.length);

            if (already_visited_cells.length + mines_count == rows * cols) {
                on_player_win();
            }
        };

        function visit_neighbouring_cells(row, col, cell, already_visited_cells) {
            already_visited_cells = already_visited_cells || [];
            if (cell.was_clicked) { return; }

            // Visiting a cell is the same as the cell being clicked.
            cell.was_clicked = true;
            already_visited_cells.push([row, col]);
            cell.adjacent_mines_count = cell_calculate_adjacent_mines_count(row, col);
            var cell_is_adjacent_to_a_mine = cell.adjacent_mines_count != 0;
            if (cell_is_adjacent_to_a_mine) { return; }

            var neighbours_positions = cell_get_neighbours_positions(row, col);

            _.forEach(neighbours_positions, function(neighbour_position) {
                var x = neighbour_position[0];
                var y = neighbour_position[1];
                if (!grid[x][y].has_mine && !grid[x][y].was_clicked) {
                    grid[x][y].adjacent_mines_count = cell_calculate_adjacent_mines_count(x, y);
                    visit_neighbouring_cells(x, y, grid[x][y], already_visited_cells);
                }
            });
        };
//        visit_neighbouring_cells(0, 0, grid[0][0]);

        function cell_get_neighbours_positions(row, col) {
            var neighbours_positions = [
                [row - 1, col - 1], [row - 1, col - 0], [row - 1, col + 1],
                [row - 0, col - 1], [row - 0, col - 0], [row - 0, col + 1],
                [row + 1, col - 1], [row + 1, col - 0], [row + 1, col + 1],
            ];

             // Some neighbours could turn out to be outside of the grid, get rid of them.
            neighbours_positions = _.filter(neighbours_positions, function(cell_pos) {
                var x = cell_pos[0];
                var y = cell_pos[1];

                return 0 <= x && x <= rows - 1
                   &&  0 <= y && y <= cols - 1;
            });

            return neighbours_positions;
        };

        function cell_calculate_adjacent_mines_count(row, col) {
            var neighbours_positions = cell_get_neighbours_positions(row, col);
            return _.reduce(_.map(neighbours_positions, function(neighbour_position) {
                var x = neighbour_position[0];
                var y = neighbour_position[1];
                return grid[x][y].has_mine ? 1 : 0;
            }), function(a, b) { return a + b; });

        };

        function reveal_mines() {
            _.forEach(mines_positions, function(mine_position) {
                var x = mine_position[0];
                var y = mine_position[1];
                grid[x][y].was_clicked = true;
            });
        }

        return {
            grid:          grid,
            reveal_mines:  reveal_mines,
            on_cell_click: on_cell_click,
        };
    };
})
.factory('Cell', function() {
    return function(args) {
        var has_mine    = args.has_mine || false;
        var was_clicked = false;
//        var mine_image_src = '';
        var adjacent_mines_count = 0;

        return  {
            has_mine:             has_mine,
            was_clicked:          was_clicked,
            adjacent_mines_count: adjacent_mines_count,
        };
    };
})
;

function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
